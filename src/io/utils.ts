import * as dd from 'dd-models';

export function actionToFuncName(action: dd.Action): string {
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
  let funcPath = actionToFuncName(action);
  if (action.__table !== currentTable) {
    funcPath = tableToObjName(action.__table) + '.' + funcPath;
  } else {
    funcPath = 'da.' + funcPath;
  }
  return funcPath;
}

export function paginateCoreFuncName(name: string): string {
  return `${name}Core`;
}
