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

export function tableName(table: dd.Table): string {
  return dd.utils.toPascalCase(table.__name);
}
