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

export function capitalizeFirstChar(s: string): string {
  if (!s) {
    return s;
  }
  return `${s.charAt(0).toUpperCase()}${s.substr(1)}`;
}

export function toPascalCase(s: string): string {
  const res = forceAllCapsTrailingID(
    camelCase(s, { preserveConsecutiveUppercase: true, pascalCase: true }),
  );
  return res;
}

export function validateSetters(
  setters: ReadonlyMap<mm.Column, unknown>,
  table: mm.Table,
  context: string,
) {
  for (const setter of setters.keys()) {
    setter.__checkSourceTable(table, `${context} [Setter: ${setter}]`);
  }
}

export function joinLines(prev: string, next: string) {
  if (!prev) {
    return next;
  }
  if (prev.charAt(prev.length - 1) === '\n') {
    if (prev.charAt(prev.length - 2) === '\n') {
      return prev + next;
    }
    return prev + '\n' + next;
  }
  return prev + '\n\n' + next;
}
