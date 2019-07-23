import * as dd from 'dd-models';
import { Action, Table } from 'dd-models';

export function actionToFuncName(action: dd.Action): string {
  if (!action.__name && action instanceof dd.WrappedAction) {
    // Temp wrapped action
    return dd.utils.capitalizeFirstLetter(
      (action as dd.WrappedAction).action.__name,
    );
  }
  return dd.utils.capitalizeFirstLetter(action.__name);
}

export function tableToObjName(table: dd.Table): string {
  return dd.utils.toPascalCase(table.__name);
}

export function tableToClsName(table: dd.Table): string {
  return `TableType${tableToObjName(table)}`;
}

export function tableName(table: dd.Table): string {
  return dd.utils.toPascalCase(table.__name);
}

export function actionCallPath(
  action: dd.Action,
  currentTable: dd.Table | null,
): string {
  const [table] = mustGetTable(action);
  let funcPath = actionToFuncName(action);
  if (table !== currentTable) {
    funcPath = tableToObjName(table) + '.' + funcPath;
  } else {
    funcPath = 'da.' + funcPath;
  }
  return funcPath;
}

export function paginateCoreFuncName(name: string): string {
  return `${name}Core`;
}

// Return the associated table of the given action,
// this also checks temp wrapped actions, the second return value
// indicates whether the given action is a temp wrapped action.
export function mustGetTable(action: Action): [Table, boolean] {
  if (action.__table) {
    return [action.__table, false];
  }
  if (action instanceof dd.WrappedAction === false) {
    throw new Error(
      `The action "${
        action.__name
      }" must be a WrappedAction if no table attached`,
    );
  }
  const table = (action as dd.WrappedAction).action.__table;
  if (!table) {
    throw new Error(
      `Unexpected empty __table in WrappedAction "${action.__name}"`,
    );
  }
  return [table, true];
}

export function lowerFirstChar(s: string): string {
  if (!s) {
    return s;
  }
  return `${s.charAt(0).toLowerCase()}${s.substr(1)}`;
}
