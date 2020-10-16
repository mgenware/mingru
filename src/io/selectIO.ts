/* eslint-disable no-param-reassign */
import * as mm from 'mingru-models';
import toTypeString from 'to-type-string';
import { throwIfFalsy } from 'throw-if-arg-empty';
import Dialect, { StringSegment } from '../dialect';
import { SQLIO, sqlIO, SQLIOBuilderOption } from './sqlIO';
import { ActionIO } from './actionIO';
import * as utils from '../lib/stringUtils';
import VarInfo, { AtomicTypeInfo, CompoundTypeInfo } from '../lib/varInfo';
import VarList from '../lib/varList';
import { registerHandler } from './actionToIO';
import * as defs from '../defs';
import { VarInfoBuilder } from '../lib/varInfoHelper';
import { forEachWithSlots } from '../lib/arrayUtils';
import { ActionToIOOptions } from './actionToIOOptions';
import BaseIOProcessor from './baseIOProcessor';

const orderByInputParamName = 'orderBy';

export class JoinIO {
  constructor(
    public path: string,
    public tableAlias: string,
    // Note that `localTable` can also be an alias of another join.
    public localTable: string,
    public localColumn: mm.Column,
    public remoteTable: string,
    public remoteColumn: mm.Column,
    public extraColumns: [mm.Column, mm.Column][],
  ) {}

  toSQL(dialect: Dialect): string {
    const e = dialect.encodeName;
    const alias1 = e(this.tableAlias);
    const alias2 = e(this.localTable);
    let sql = `INNER JOIN ${e(this.remoteTable)} AS ${e(this.tableAlias)} ON ${alias1}.${e(
      this.remoteColumn.getDBName(),
    )} = ${alias2}.${e(this.localColumn.getDBName())}`;

    // Handle multiple columns in a join.
    if (this.extraColumns.length) {
      for (const [col1, col2] of this.extraColumns) {
        sql += ` AND ${alias1}.${e(col1.getDBName())} = ${alias2}.${e(col2.getDBName())}`;
      }
    }
    return sql;
  }
}

export class OrderByInputIO {
  constructor(
    public enumTypeName: string,
    public enumNames: string[],
    public enumValues: StringSegment[][],
    // The name of the variable used in SELECT IO SQL.
    public sqlVarName: string,
  ) {}
}

export class SelectedColumnIO {
  constructor(
    public selectedColumn: mm.SelectActionColumns,
    public valueSQL: StringSegment[],
    // `varName` is alias if present. Otherwise, alias is auto generated from column input name.
    public varName: string,
    public alias: string | null,
    public column: mm.Column | null,
    // Available when we can guess the evaluated type,
    // e.g. an expression containing only one column or `SQLCall`.
    public resultType: mm.ColumnType | null,
  ) {
    throwIfFalsy(selectedColumn, 'selectedColumn');
    throwIfFalsy(valueSQL, 'valueSQL');
  }

  getResultType(): mm.ColumnType {
    if (this.resultType) {
      return this.resultType;
    }
    if (!this.selectedColumn.__type) {
      throw new Error(
        `No column type found on column "${toTypeString(
          this.selectedColumn,
        )}", SQL: "${this.valueSQL.toString()}"`,
      );
    }
    return this.selectedColumn.__type;
  }
}

export class SelectIO extends ActionIO {
  constructor(
    dialect: Dialect,
    public selectAction: mm.SelectAction,
    sql: StringSegment[],
    // `cols` can be empty, it indicates `SELECT *`, which is used in `selectExists`.
    public cols: SelectedColumnIO[],
    public whereIO: SQLIO | null,
    funcArgs: VarList,
    execArgs: VarList,
    returnValues: VarList,
    // K: ORDER BY params name, V: IO.
    public orderByInputIOs: Map<string, OrderByInputIO>,
  ) {
    super(dialect, selectAction, sql, funcArgs, execArgs, returnValues);
    throwIfFalsy(selectAction, 'action');
    throwIfFalsy(sql, 'sql');
  }
}

export class SelectIOProcessor extends BaseIOProcessor {
  hasJoin = false;
  // Tracks all processed joins, when processing a new join,
  // we can reuse the JoinIO if it already exists (K: join path, V: `JoinIO`).
  jcMap = new Map<string, JoinIO>();
  // All processed joins
  joins: JoinIO[] = [];
  // Make sure all join table alias names are unique.
  joinedTableCounter = 0;
  // Tracks all selected column names, and throw on duplicates.
  selectedNames = new Set<string>();
  fromTable: mm.Table;

  // Number of ORDER BY inputs.
  orderByInputCounter = 1;
  // K: ORDER BY params name, V: IO.
  orderByInputIOs = new Map<string, OrderByInputIO>();

  // Pascal case of table name.
  tablePascalName = '';
  // Pascal case of action name.
  actionPascalName = '';
  // Used to help generate a type name for this action.
  actionUniqueTypeName = '';

  // Params needed when ORDER BY inputs are present.
  private orderByInputParams: VarInfo[] = [];

  constructor(public action: mm.SelectAction, opt: ActionToIOOptions) {
    super(action, opt);

    const fromTable = action.mustGetTable();
    this.fromTable = fromTable;
  }

  convert(): SelectIO {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sql: StringSegment[] = ['SELECT '];
    const { action, opt, selectedNames, fromTable } = this;
    const { dialect } = opt;
    const { limitValue, offsetValue, orderByColumns, groupByColumns, distinctFlag } = action;
    const selMode = action.mode;

    if (distinctFlag) {
      sql.push('DISTINCT ');
    }

    if (!opt.selectionLiteMode) {
      // NOTE: not the table defined by FROM, it's the root table defined in table actions.
      // Those fields are used to generate result type definition.
      // This process call be skipped if we don't need a result type.
      this.tablePascalName = utils.tablePascalName((action.__rootTable || fromTable).__name);
      this.actionPascalName = utils.actionPascalName(action.mustGetName());
      this.actionUniqueTypeName = `${this.tablePascalName}Table${this.actionPascalName}`;
    }

    let columns: mm.SelectActionColumns[];
    if (selMode === mm.SelectActionMode.exists) {
      if (action.columns.length) {
        throw new Error('You cannot have selected columns in `selectExists`');
      }
      columns = [];
    } else {
      columns = action.columns.length ? action.columns : Object.values(fromTable.__columns);
    }

    // Checks if there's any joins in this query.
    let hasJoin = columns.some((sCol) => {
      const [col] = this.analyzeSelectedColumn(sCol);
      return col && col.__table instanceof mm.JoinedTable;
    });
    if (!hasJoin && action.whereSQLValue) {
      hasJoin = action.whereSQLValue.enumerateColumns(
        (col) => col.__table instanceof mm.JoinedTable,
      );
    }
    this.hasJoin = hasJoin;

    // Handle columns.
    const colIOs: SelectedColumnIO[] = [];

    if (selMode === mm.SelectActionMode.exists) {
      sql.push('EXISTS(SELECT ');
    }
    if (columns.length) {
      columns.forEach((col, i) => {
        const selIO = this.handleSelectedColumn(col);
        const hasSeparator = i !== columns.length - 1 && columns.length > 1;
        if (selectedNames.has(selIO.varName)) {
          throw new Error(`The selected column name "${selIO.varName}" already exists`);
        }
        selectedNames.add(selIO.varName);
        colIOs.push(selIO);

        sql.push(...selIO.valueSQL);
        if (hasSeparator) {
          sql.push(', ');
        }
      });
    } else {
      sql.push('*');
    }

    // FROM
    const fromSQL = this.handleFrom(fromTable);
    sql.push(' ' + fromSQL);

    // WHERE
    // Note: WHERE SQL is created here, but only appended to the `sql` variable
    // after joins are handled below.
    let whereIO: SQLIO | null = null;
    let whereSQL: StringSegment[] = [];
    if (action.whereSQLValue) {
      whereIO = sqlIO(action.whereSQLValue, dialect, fromTable, {
        rewriteElement: (ele) => {
          if (ele.type === mm.SQLElementType.column) {
            const col = ele.toColumn();
            const colTable = col.mustGetTable();
            if (colTable instanceof mm.JoinedTable) {
              this.handleJoinRecursively(col);
            }
            return this.getColumnSQL(col);
          }
          return null;
        },
      });
      whereSQL = [' WHERE ', ...whereIO.code];
    }

    // Joins
    if (this.hasJoin) {
      for (const join of this.joins) {
        const joinSQL = join.toSQL(dialect);
        sql.push(' ' + joinSQL);
      }
    }

    // Append WHERE SQL after joins
    if (whereSQL.length) {
      sql.push(...whereSQL);
    }

    // ORDER BY
    if (orderByColumns.length) {
      sql.push(' ORDER BY ');

      forEachWithSlots(
        orderByColumns,
        (col) => {
          sql.push(...this.getOrderByColumnSQL(col));
        },
        () => sql.push(', '),
      );
    }

    // GROUP BY
    if (groupByColumns.length) {
      sql.push(' GROUP BY ');

      forEachWithSlots(
        groupByColumns,
        (col) => {
          sql.push(dialect.encodeName(col));
        },
        () => sql.push(', '),
      );
    }

    // HAVING
    let havingIO: SQLIO | null = null;
    if (action.havingSQLValue) {
      havingIO = sqlIO(action.havingSQLValue, dialect, fromTable, {
        rewriteElement: (ele) => {
          if (ele.type === mm.SQLElementType.column) {
            const col = ele.toColumn();
            if (col.__table instanceof mm.JoinedTable) {
              throw new Error(
                `Joins are not allowed in HAVING clause, offending column "${col.__name}".`,
              );
            }
            return [dialect.encodeColumnName(col)];
          }
          return null;
        },
      });

      sql.push(' HAVING ', ...havingIO.code);
    }

    // Handle ending parenthesis.
    if (selMode === mm.SelectActionMode.exists) {
      sql.push(')');
    }

    // Func args
    const limitTypeInfo = new VarInfo('limit', defs.intTypeInfo);
    const offsetTypeInfo = new VarInfo('offset', defs.intTypeInfo);
    const funcArgs = new VarList(`Func args of action "${action.__name}"`, true);
    funcArgs.add(defs.dbxQueryableVar);
    const execArgs = new VarList(`Exec args of action "${action.__name}"`, true);
    this.flushInputs(funcArgs, execArgs, whereIO);
    this.flushInputs(funcArgs, execArgs, havingIO);

    if (action.pagination) {
      funcArgs.add(limitTypeInfo);
      funcArgs.add(offsetTypeInfo);
      funcArgs.add(new VarInfo('max', defs.intTypeInfo));
      execArgs.add(limitTypeInfo);
      execArgs.add(offsetTypeInfo);
    } else if (selMode === mm.SelectActionMode.page) {
      funcArgs.add(new VarInfo('page', defs.intTypeInfo));
      funcArgs.add(new VarInfo('pageSize', defs.intTypeInfo));
      execArgs.add(limitTypeInfo);
      execArgs.add(offsetTypeInfo);
    } else if (limitValue !== undefined) {
      // User specified LIMIT and OFFSET
      // Ignore number values, they were directly written in SQL.
      if (limitValue instanceof mm.SQLVariable) {
        const userLimitVarInfo = VarInfoBuilder.fromSQLVar(limitValue, dialect);
        funcArgs.add(userLimitVarInfo);
        execArgs.add(userLimitVarInfo);
      }
      if (offsetValue instanceof mm.SQLVariable) {
        const userOffsetVarInfo = VarInfoBuilder.fromSQLVar(offsetValue, dialect);
        funcArgs.add(userOffsetVarInfo);
        execArgs.add(userOffsetVarInfo);
      }
    }

    // ORDER BY inputs.
    for (const param of this.orderByInputParams) {
      funcArgs.add(param);
    }

    // Set return values.
    const returnValues = new VarList(`Return values of action "${action.__name}"`, true);
    if (!opt.selectionLiteMode) {
      if (selMode === mm.SelectActionMode.field) {
        const col = colIOs[0];
        const typeInfo = dialect.colTypeToGoType(col.getResultType());
        returnValues.add(new VarInfo(mm.ReturnValues.result, typeInfo));
      } else if (selMode === mm.SelectActionMode.exists) {
        returnValues.add(new VarInfo(mm.ReturnValues.result, defs.boolTypeInfo));
      } else {
        // `selMode` now equals `.list` or `.row`.
        let resultType: string;
        // Check if result type is renamed.
        if (action.__attrs[mm.ActionAttributes.resultTypeName]) {
          resultType = `${action.__attrs[mm.ActionAttributes.resultTypeName]}`;
        } else {
          resultType = `${this.actionUniqueTypeName}Result`;
        }

        let isResultTypeArray = false;
        if (selMode === mm.SelectActionMode.list || selMode === mm.SelectActionMode.page) {
          isResultTypeArray = true;
        }
        const resultTypeInfo = new AtomicTypeInfo(resultType, null, null);

        returnValues.add(
          new VarInfo(
            mm.ReturnValues.result,
            new CompoundTypeInfo(resultTypeInfo, true, isResultTypeArray),
          ),
        );
        if (action.pagination) {
          returnValues.add(new VarInfo('max', defs.intTypeInfo));
        } else if (action.mode === mm.SelectActionMode.page) {
          returnValues.add(new VarInfo('hasNext', defs.boolTypeInfo));
        }
      }
    }

    // Handle UNIONs.
    let next = action.nextSelectAction;
    while (next) {
      try {
        sql.push(' UNION');
        if (action.unionAllFlag) {
          sql.push(' ALL');
        }
        sql.push(' ');
        const nextProcessor = new SelectIOProcessor(next, opt);
        // Merge func args and exec args.
        const nextIO = nextProcessor.convert();
        funcArgs.merge(nextIO.funcArgs.list);
        execArgs.merge(nextIO.execArgs.list);

        next = next.nextSelectAction;

        const nextSQL = nextIO.sql;
        if (nextSQL) {
          sql.push(...nextSQL);
        }
      } catch (err) {
        err.message += ' [UNION]';
        throw err;
      }
    }

    return new SelectIO(
      dialect,
      action,
      sql,
      colIOs,
      whereIO,
      funcArgs,
      execArgs,
      returnValues,
      this.orderByInputIOs,
    );
  }

  // Declared as a property to avoid `this` issues as it's used as a callback to other classes.

  // eslint-disable-next-line class-methods-use-this
  private flushInputs(funcArgs: VarList, execArgs: VarList, io: SQLIO | null) {
    if (!io) {
      return;
    }
    // WHERE or HAVING may contain duplicate vars, we only need distinct vars in func args.
    funcArgs.merge(io.distinctVars);
    // We need to pass all variables to Exec.
    execArgs.merge(io.vars);
  }

  private getOrderByColumnSQL(col: mm.OrderByColumnType): StringSegment[] {
    if (col instanceof mm.OrderByColumnInput) {
      const enumTypeName = `${this.actionUniqueTypeName}OrderBy${this.orderByInputCounter}`;
      const orderByParamName = `${orderByInputParamName}${this.orderByInputCounter}`;
      const orderByResultName = `${orderByParamName}SQL`;
      const names: string[] = [];
      const values: StringSegment[][] = [];
      for (const choice of col.columns) {
        const [displayName, code] = this.getOrderByNonInputColumnSQL(choice);
        names.push(mm.utils.toPascalCase(`${enumTypeName}${displayName}`));
        values.push(code);
      }
      this.orderByInputIOs.set(
        orderByParamName,
        new OrderByInputIO(enumTypeName, names, values, orderByResultName),
      );

      // Add ORDER BY inputs params.
      // `orderBy1` for enum param, and `orderBy1Desc` for ordering.
      this.orderByInputParams.push(new VarInfo(orderByParamName, defs.intTypeInfo));
      const orderByDescVarName = `${orderByParamName}Desc`;
      this.orderByInputParams.push(new VarInfo(orderByDescVarName, defs.boolTypeInfo));

      this.orderByInputCounter++;
      return [{ code: orderByResultName }];
    }
    const [, code] = this.getOrderByNonInputColumnSQL(col.column);
    if (col.desc) {
      return [...code, ' DESC'];
    }
    return code;
  }

  // Gets ORDER BY value of the specified column. Returns an array of string segments
  // along with a column display name which is used in ORDER BY inputs.
  private getOrderByNonInputColumnSQL(col: mm.SelectActionColumnNames): [string, StringSegment[]] {
    const { dialect } = this.opt;

    if (typeof col === 'string') {
      return [col, [dialect.encodeName(col)]];
    }
    if (col instanceof mm.Column) {
      return [col.mustGetName(), this.getColumnSQL(col)];
    }
    if (col instanceof mm.RawColumn) {
      if (col.selectedName) {
        return [col.selectedName, [dialect.encodeName(col.selectedName)]];
      }
      if (col.core instanceof mm.Column) {
        return [col.core.mustGetName(), this.getColumnSQL(col.core)];
      }
      throw new Error(
        'The argument `selectedName` is required for an SQL expression without any columns inside',
      );
    }
    throw new Error(`Unsupported orderBy column "${toTypeString(col)}"`);
  }

  private getColumnSQL(col: mm.Column): StringSegment[] {
    const { dialect } = this.opt;
    let value = dialect.encodeColumnName(col);
    if (this.hasJoin) {
      const colTable = col.mustGetTable();
      if (colTable instanceof mm.JoinedTable) {
        const jt = col.__table as mm.JoinedTable;
        const joinPath = jt.keyPath;
        const join = this.jcMap.get(joinPath);
        if (!join) {
          throw new Error(
            `Column path ”${joinPath}“ does not have a associated value in column alias map`,
          );
        }
        value = `${dialect.encodeName(join.tableAlias)}.${value}`;
      } else {
        // Use table name as alias
        value = `${dialect.encodeName(this.localTableAlias(colTable))}.${value}`;
      }
    }
    return [value];
  }

  private handleFrom(table: mm.Table): string {
    const e = this.opt.dialect.encodeName;
    const tableDBName = table.getDBName();
    const encodedTableName = e(tableDBName);
    let sql = `FROM ${encodedTableName}`;
    if (this.hasJoin) {
      sql += ' AS ' + encodedTableName;
    }
    return sql;
  }

  /*
  * Returns:
  [
    // Can be a column from params, or extracted from a renamed raw column,
    // or extracted from the expression of a raw column
    Column,
    RawColumn,
    ColumnType,
  ]
  */
  private analyzeSelectedColumn(
    sCol: mm.SelectActionColumns,
  ): [mm.Column | null, mm.RawColumn | null, mm.ColumnType | null] {
    if (!sCol) {
      throw new Error('Unexpected null column at `fetchColumns`');
    }
    // If user uses a column directly
    if (sCol instanceof mm.Column) {
      return [sCol, null, sCol.__type];
    }
    if (sCol instanceof mm.RawColumn === false) {
      throw new Error(`Expected an "RawColumn", got ${toTypeString(sCol)}`);
    }
    // If user uses a renamed column (a RawColumn with core = column, and selectedName = newName)
    const rawCol = sCol;
    if (rawCol.core instanceof mm.Column) {
      const col = rawCol.core;
      return [col, rawCol, col.__type];
    }
    if (rawCol.core instanceof mm.SQL === false) {
      throw new Error(`Expected an "SQL" object, got ${toTypeString(rawCol.core)}`);
    }
    // Now, RawColumn.core is an SQL expression. Try to extract a column from it.
    const sql = rawCol.core;
    const column = sql.findFirstColumn();
    // In this case, we can guess the result type in case user specified type is not present
    const resultType = this.guessColumnType(sql);
    return [column, rawCol, resultType];
  }

  // eslint-disable-next-line class-methods-use-this
  private guessColumnType(sql: mm.SQL): mm.ColumnType | null {
    if (sql.elements.length === 1) {
      const first = sql.elements[0];
      if (first.type === mm.SQLElementType.column) {
        return first.toColumn().__type;
      }
      if (first.type === mm.SQLElementType.call) {
        const call = first.toCall();
        const { returnType } = call;
        if (typeof returnType === 'number') {
          const returnTypeArg = call.params[returnType];
          if (!returnTypeArg) {
            throw new Error(`Index of out range when probing return type, index: ${returnType}`);
          }
          if (returnTypeArg instanceof mm.Column) {
            return returnTypeArg.__type;
          }
          throw new Error(
            `Index-based return type data is not a \`Column\`, got ${toTypeString(returnTypeArg)}`,
          );
        }
        return returnType;
      }
    }
    return null;
  }

  // Converts column SQL expr to SQL code segments.
  // It also returns the variable name of this column. Variable name is used to generate result property type.
  private getColumnSQLCode(
    colSQL: mm.SQL,
    col: mm.Column,
    alias: string | null,
    opt?: SQLIOBuilderOption,
  ): [string, StringSegment[]] {
    // Alias is required when `hasJoin` is true.
    const inputName = col.inputName();
    if (this.hasJoin) {
      alias = alias || inputName;
    }
    const sql = alias ? this.opt.dialect.as(colSQL, alias) : colSQL;
    const variableName = alias || inputName;
    return [variableName, sqlIO(sql, this.opt.dialect, this.fromTable, opt).code];
  }

  // Returns SQL expr of the selected column.
  /**
   * Reasons for returning `StringSegment[]` instead of `mm.SQL`:
   * We need to replace selected columns to columns with aliases (AS blablabla),
   * `mm.SQL` is not meant to be expressive, we have raw columns for columns with
   * an alias, we should use raw SQL aliases in `mm.SQL`.
   */
  private handleSelectedColumn(sCol: mm.SelectActionColumns): SelectedColumnIO {
    const { fromTable } = this;
    const { dialect } = this.opt;
    const [embeddedCol, rawCol, resultType] = this.analyzeSelectedColumn(sCol);
    if (embeddedCol) {
      // There's at least one column in this expression:
      if (!rawCol) {
        // Plain columns like `post.id`.
        const colSQL = this.handleColumn(embeddedCol);
        const [varName, colSQLCode] = this.getColumnSQLCode(colSQL, embeddedCol, null);

        return new SelectedColumnIO(sCol, colSQLCode, varName, null, embeddedCol, resultType);
      }

      const rawColCore = rawCol.core;
      if (rawColCore instanceof mm.Column) {
        // RawColumn with `.core` is a column (a renamed column) such as `post.id.as('newName')`.
        const colSQL = this.handleColumn(embeddedCol);
        const [varName, colSQLCode] = this.getColumnSQLCode(
          colSQL,
          embeddedCol,
          rawCol.selectedName,
        );

        return new SelectedColumnIO(
          sCol,
          colSQLCode,
          varName,
          rawCol.selectedName,
          embeddedCol,
          resultType,
        );
      }

      // Here, `RawColumn.core` is an expression with a column inside.
      // Replace the column with the expr above.
      // Alias is required when column is inside an expr.
      // Example: SELECT COUNT(col) AS col_name.
      const alias = rawCol.selectedName || embeddedCol.inputName();
      const [varName, colSQLCode] = this.getColumnSQLCode(rawColCore, embeddedCol, alias, {
        rewriteElement: (element) => {
          if (element.value === embeddedCol) {
            return sqlIO(this.handleColumn(embeddedCol), this.opt.dialect, fromTable).code;
          }
          return null;
        },
      });

      return new SelectedColumnIO(
        sCol,
        colSQLCode,
        varName,
        rawCol.selectedName || null,
        embeddedCol,
        resultType,
      );
    }

    // Expression with no columns inside.
    if (!rawCol) {
      throw new Error(`Unexpected null raw column from selected column "${sCol}"`);
    }
    if (rawCol.core instanceof mm.Column) {
      throw new Error(`Unexpected column object in raw column "${rawCol}"`);
    }
    let rawExpr = rawCol.core;
    // If we cannot guess the result type (`resultType` is null), and neither does a user specified
    // type (`type` is null) exists, we throw cuz we cannot determine the result type.
    if (!resultType && !sCol.__type) {
      throw new Error(
        `Column type is required for a "${toTypeString(sCol)}" without any embedded columns`,
      );
    }
    if (!rawCol.selectedName) {
      throw new Error(
        'The argument "selectedName" is required for an SQL expression without any columns inside',
      );
    }

    // Add alias if needed.
    if (rawCol.selectedName) {
      rawExpr = dialect.as(rawExpr, rawCol.selectedName);
    }
    const info = sqlIO(rawExpr, dialect, fromTable);
    return new SelectedColumnIO(
      sCol,
      info.code,
      rawCol.selectedName, // inputName
      rawCol.selectedName, // alias is always present in this case.
      null,
      resultType,
    );
  }

  private handleJoinRecursively(jc: mm.Column): JoinIO {
    const table = jc.__table as mm.JoinedTable;
    const result = this.jcMap.get(table.keyPath);
    if (result) {
      return result;
    }

    let localTableName: string;
    const { srcColumn, destColumn, destTable } = table;
    const srcTable = srcColumn.mustGetTable();
    if (srcTable instanceof mm.JoinedTable) {
      const srcIO = this.handleJoinRecursively(srcColumn);
      localTableName = srcIO.tableAlias;
    } else {
      localTableName = this.localTableAlias(srcTable);
    }

    const joinIO = new JoinIO(
      table.keyPath,
      this.nextJoinedTableName(),
      localTableName,
      srcColumn,
      destTable.getDBName(),
      destColumn,
      table.extraColumns,
    );
    this.jcMap.set(table.keyPath, joinIO);
    this.joins.push(joinIO);
    return joinIO;
  }

  // Returns SQL expr of the selected plain column object.
  private handleColumn(col: mm.Column): mm.SQL {
    const { action } = this;
    const { dialect } = this.opt;
    const e = dialect.encodeName;
    // Make sure column is initialized.
    const colTable = col.mustGetTable();
    // Make sure column is from current table.
    const sourceTable = action.mustGetTable();
    col.checkSourceTable(sourceTable);

    let colSQL: mm.SQL;
    if (colTable instanceof mm.JoinedTable) {
      const joinIO = this.handleJoinRecursively(col);
      if (!col.__mirroredColumn) {
        throw new Error(
          `Internal error: unexpected empty \`mirroredColumn\` in joined column "${toTypeString(
            col,
          )}"`,
        );
      }
      colSQL = mm.sql`${e(joinIO.tableAlias)}.${e(col.__mirroredColumn.getDBName())}`;
    } else {
      // Column without a join.
      colSQL = mm.sql`${e(col.getDBName())}`;
      if (this.hasJoin) {
        // Each column must have a prefix in a SQL with joins.
        // NOTE: use table `DBName` as alias.
        colSQL = mm.sql`${e(this.localTableAlias(colTable))}.${colSQL}`;
      }
    }
    return colSQL;
  }

  private nextJoinedTableName(): string {
    this.joinedTableCounter++;
    return `join_${this.joinedTableCounter}`;
  }

  // eslint-disable-next-line class-methods-use-this
  private localTableAlias(table: mm.Table): string {
    return table.getDBName();
  }
}

export function selectIO(action: mm.Action, opt: ActionToIOOptions): SelectIO {
  const converter = new SelectIOProcessor(action as mm.SelectAction, opt);
  return converter.convert();
}

registerHandler(mm.ActionType.select, selectIO);
