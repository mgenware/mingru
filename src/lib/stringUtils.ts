import * as mm from 'mingru-models';
import snakeCase from 'decamelize';
import camelCase from 'camelcase';

export function forceAllCapsTrailingID(s: string): string {
  if (s.endsWith('Id')) {
    // eslint-disable-next-line prefer-template
    return s.substr(0, s.length - 'Id'.length) + 'ID';
  }
  return s;
}

export function toSnakeCase(s: string): string {
  return snakeCase(s);
}

export function toCamelCase(s: string): string {
  return forceAllCapsTrailingID(camelCase(s, { preserveConsecutiveUppercase: true }));
}

export function lowercaseFirstChar(s: string): string {
  if (!s) {
    return s;
  }
  return `${s.charAt(0).toLowerCase()}${s.substr(1)}`;
}

export function toPascalCase(s: string): string {
  const res = forceAllCapsTrailingID(
    camelCase(s, { preserveConsecutiveUppercase: true, pascalCase: true }),
  );
  if (res === 'Id') {
    return 'ID';
  }
  return res;
}

export function tablePascalName(tableName: string): string {
  return toPascalCase(tableName);
}

export function actionPascalName(actionName: string): string {
  return toPascalCase(actionName);
}

export function tableTypeName(tableName: string): string {
  return `TableType${tablePascalName(tableName)}`;
}

export function actionCallPath(
  className: string | null,
  actionName: string,
  isPrivate: boolean,
): string {
  const funcName = actionPascalName(actionName);
  const resolvedTableName = className ? tablePascalName(className) : 'da';
  return resolvedTableName + '.' + (isPrivate ? lowercaseFirstChar(funcName) : funcName);
}

export function paginateCoreFuncName(name: string): string {
  return `${name}Core`;
}

export function validateSetters(setters: ReadonlyMap<mm.Column, unknown>, table: mm.Table) {
  for (const setter of setters.keys()) {
    setter.__checkSourceTable(table);
  }
}
