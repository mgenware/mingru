import * as dd from 'dd-models';

export function actionPascalName(actionName: string): string {
  return dd.utils.toPascalCase(actionName);
}

export function tableTypeName(tableName: string): string {
  return `TableType${tablePascalName(tableName)}`;
}

export function tablePascalName(tableName: string): string {
  return dd.utils.toPascalCase(tableName);
}

export function actionCallPath(
  tableName: string | null,
  actionName: string,
): string {
  const resolvedTableName = tableName ? tablePascalName(tableName) : 'da';
  return resolvedTableName + '.' + actionPascalName(actionName);
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
