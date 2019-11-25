import * as mm from 'mingru-models';

export function actionPascalName(actionName: string): string {
  return mm.utils.toPascalCase(actionName);
}

export function tableTypeName(tableName: string): string {
  return `TableType${tablePascalName(tableName)}`;
}

export function tablePascalName(tableName: string): string {
  return mm.utils.toPascalCase(tableName);
}

export function actionCallPath(
  tableName: string | null,
  actionName: string,
  isPrivate: boolean,
): string {
  const funcName = actionPascalName(actionName);
  const resolvedTableName = tableName ? tablePascalName(tableName) : 'da';
  return (
    resolvedTableName +
    '.' +
    (isPrivate ? lowercaseFirstChar(funcName) : funcName)
  );
}

export function paginateCoreFuncName(name: string): string {
  return `${name}Core`;
}

export function lowercaseFirstChar(s: string): string {
  if (!s) {
    return s;
  }
  return `${s.charAt(0).toLowerCase()}${s.substr(1)}`;
}

export function validateSetters(
  setters: Map<mm.Column, mm.SQL>,
  table: mm.Table,
) {
  for (const setter of setters.keys()) {
    setter.checkSourceTable(table);
  }
}
