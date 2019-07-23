import * as dd from 'dd-models';

export function actionToFuncName(action: dd.Action): string {
  if (!action.__name) {
    throw new Error('action is not initialized');
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
  const table = action.__table;
  if (!table) {
    throw new Error('Action does not have a bound table');
  }
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

export function lowerFirstChar(s: string): string {
  if (!s) {
    return s;
  }
  return `${s.charAt(0).toLowerCase()}${s.substr(1)}`;
}
