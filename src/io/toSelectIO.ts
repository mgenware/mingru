import * as dd from 'dd-models';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect from '../dialect';
import * as io from './io';
import NameContext from '../lib/nameContext';
import toTypeString from 'to-type-string';

// Used internally in SelectProcessor to save an SQL of a selected column associated with an alias.
class ColumnSQL {
  constructor(public sql: string, public alias: string) {}
}

export class SelectProcessor {
  // Tracks all processed joins, when processing a new join, we can reuse the JoinIO if it already exists
  jcMap = new Map<string, io.JoinIO>();
  // All processed joins
  joins: io.JoinIO[] = [];
  // Make sure all join table alias names are unique
  joinedTableCounter = 0;
  // Make sure all selected column names are unique
  selectedNameContext = new NameContext();

  constructor(public action: dd.SelectAction, public dialect: Dialect) {
    throwIfFalsy(action, 'action');
    throwIfFalsy(dialect, 'dialect');
  }

  convert(): io.SelectIO {
    let sql = 'SELECT ';
    const { action } = this;
    const { columns, table: from } = action;
    const hasJoin = columns.some(sCol => {
      const [col] = this.fetchColumns(sCol);
      if (col && col.props.isJoinedColumn()) {
        return true;
      }
      return false;
    });

    // Process columns
    const colIOs: io.SelectedColumnIO[] = [];
    for (const col of columns) {
      const selIO = this.handleSelectedColumn(col, hasJoin);
      colIOs.push(selIO);
    }
    sql += colIOs.map(c => c.sql).join(', ');

    // from
    const fromIO = this.handleFrom(from as dd.Table, hasJoin);
    sql += ' ' + fromIO.sql;

    // where
    let whereIO: io.SQLIO | null = null;
    if (action.whereSQL) {
      whereIO = new io.SQLIO(action.whereSQL);
      sql += ' WHERE ' + whereIO.toSQL(this.dialect);
    }

    // joins
    if (hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(this.dialect);
        sql += ' ' + joinSQL;
      }
    }
    return new io.SelectIO(this.action, sql, colIOs, fromIO, whereIO);
  }

  private handleFrom(table: dd.Table, hasJoin: boolean): io.TableIO {
    const e = this.dialect.escape;
    let sql = `FROM ${e(table.__name)}`;
    if (hasJoin) {
      sql += ' AS ' + e(io.MainAlias);
    }
    return new io.TableIO(table, sql);
  }

  // Column = sc is a column || extracted from calculated column
  // Calculated column = sc is a calculated column
  private fetchColumns(
    sCol: dd.SelectActionColumns,
  ): [dd.Column | null, dd.CalculatedColumn | null] {
    // If user uses a column directly
    if (sCol instanceof dd.Column) {
      return [sCol as dd.Column, null];
    }
    // If user uses a renamed column (a CalculatedColumn with core = column, and selectedName = newName)
    const cc = sCol as dd.CalculatedColumn;
    if (cc.core instanceof dd.Column) {
      return [cc.core as dd.Column, cc];
    }
    // Now, CalculatedColumn.core is an SQL expression. Try to extract a column from it.
    for (const element of (cc.core as dd.SQL).elements) {
      if (element.type === dd.SQLElementType.column) {
        return [element.toColumn(), cc];
      }
    }
    return [null, cc];
  }

  private handleSelectedColumn(
    sCol: dd.SelectActionColumns,
    hasJoin: boolean,
  ): io.SelectedColumnIO {
    const { dialect } = this;
    const [col, calcCol] = this.fetchColumns(sCol);
    if (col) {
      const colSQL = this.handleColumn(
        col,
        hasJoin,
        calcCol ? calcCol.selectedName : null,
      );
      if (!calcCol) {
        // Pure column-based selected column
        return new io.SelectedColumnIO(
          sCol,
          colSQL.sql,
          colSQL.alias,
          col,
          null,
        );
      }

      // CalculatedColumn with .core is a column (a renamed column)
      if (calcCol.core instanceof dd.Column) {
        // Use CalculatedColumn.selectedName as alias
        return new io.SelectedColumnIO(
          sCol,
          colSQL.sql,
          calcCol.selectedName,
          col,
          null,
        );
      }

      // Here, we have a CalculatedColumn.core is an expression with a column inside
      const rawExpr = calcCol.core as dd.SQL;
      const exprIO = new io.SQLIO(rawExpr);
      // Replace the column with SQL only (no alias).
      // Imagine new CalculatedColumn(dd.sql`COUNT(${col.as('a')})`, 'b'), the embedded column would be interpreted as `'col' AS 'a'`, but it really should be `COUNT('col') AS 'b'`, so this step replace the embedded with the SQL without its attached alias.
      const sql = exprIO.toSQL(dialect, element => {
        if (element.value === col) {
          return colSQL.sql;
        }
        return null;
      });
      // SelectedColumn.alias takes precedence over colSQL.alias
      return new io.SelectedColumnIO(
        sCol,
        sql,
        calcCol.selectedName || colSQL.alias,
        col,
        null,
      );
    } else {
      if (!calcCol) {
        throw new Error(
          `Unexpected null calculated column from selected column "${sCol}"`,
        );
      }
      // Expression with no columns inside
      const rawExpr = calcCol.core as dd.SQL;
      const exprIO = new io.SQLIO(rawExpr);
      const sql = exprIO.toSQL(dialect);
      if (!sCol.props) {
        throw new Error(
          `Column props is required for a "${toTypeString(
            sCol,
          )}" without any embedded columns`,
        );
      }
      return new io.SelectedColumnIO(
        sCol,
        sql,
        calcCol.selectedName,
        null,
        sCol.props,
      );
    }
  }

  private handleJoinRecursively(jc: dd.Column): io.JoinIO {
    const table = jc.props.castToJoinedTable();
    const result = this.jcMap.get(table.keyPath);
    if (result) {
      return result;
    }

    let localTableName: string;
    const { srcColumn, destColumn } = table;
    if (srcColumn.props.isJoinedColumn()) {
      const srcIO = this.handleJoinRecursively(srcColumn);
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = srcColumn.props.tableName();
    }

    const joinIO = new io.JoinIO(
      table.keyPath,
      this.nextJoinedTableName(),
      localTableName,
      srcColumn,
      destColumn.props.tableName(),
      destColumn,
    );
    this.jcMap.set(table.keyPath, joinIO);
    this.joins.push(joinIO);
    return joinIO;
  }

  private handleColumn(
    col: dd.Column,
    hasJoin: boolean,
    userAlias: string | null, // if an user alias is set, we don't need to guess the input name just use it as alias
  ): ColumnSQL {
    const { dialect } = this;
    const e = dialect.escape;
    const alias = userAlias || this.nextSelectedName(col.props.inputName());
    // Check for joined column
    if (col.props.isJoinedColumn()) {
      const joinIO = this.handleJoinRecursively(col);
      if (!col.props.mirroredColumn) {
        throw new Error(
          `Internal error: unexpected empty mirroredColumn in joined column "${toTypeString(
            col,
          )}"`,
        );
      }
      const sql = `${e(joinIO.tableAlias)}.${e(
        col.props.mirroredColumn.props.name,
      )}`;
      return new ColumnSQL(dialect.as(sql, alias), alias);
    } else {
      // Normal column
      let sql = '';
      if (hasJoin) {
        sql = `${e(io.MainAlias)}.`;
      }
      sql += e(col.props.name);

      if (hasJoin) {
        sql = dialect.as(sql, alias);
      }
      return new ColumnSQL(sql, alias);
    }
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `_join_${this.joinedTableCounter}`;
  }

  private nextSelectedName(name: string): string {
    return this.selectedNameContext.get(name);
  }
}

export default function selectIO(
  action: dd.SelectAction,
  dialect: Dialect,
): io.SelectIO {
  const pro = new SelectProcessor(action, dialect);
  return pro.convert();
}
