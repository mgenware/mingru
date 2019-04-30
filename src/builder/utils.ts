import * as dd from 'dd-models';

export function actionToFuncName(action: dd.Action): string {
  return dd.utils.capitalizeFirstLetter(action.__name);
}

export function tableToObjName(table: dd.Table): string {
  return dd.utils.capitalizeFirstLetter(dd.utils.toCamelCase(table.__name));
}

export function tableToClsName(table: dd.Table): string {
  return `TableType${tableToObjName(table)}`;
}

export function actionToFullFuncName(action: dd.Action, ta: dd.TA): string {
  if (action.__table === ta.__table) {
    return actionToFuncName(action);
  }
  return `${tableToObjName(action.__table)}.${actionToFuncName(action)}`;
}
