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
  const res = forceAllCapsTrailingID(camelCase(s, { preserveConsecutiveUppercase: true }));
  if (res === 'ID') {
    return 'id';
  }
  return res;
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
  return res;
}

export function validateSetters(setters: ReadonlyMap<mm.Column, unknown>, table: mm.Table) {
  for (const setter of setters.keys()) {
    setter.__checkSourceTable(table);
  }
}
