import * as mm from 'mingru-models';
import * as su from '../lib/stringUtils.js';
import * as core from './core.js';
import * as types from './types.js';

export function tablePascalName(tableName: string): string {
  return su.toPascalCase(tableName);
}

export function actionPascalName(actionName: string): string {
  return su.toPascalCase(actionName);
}

export function paginateCoreFuncName(name: string): string {
  return `${name}Core`;
}

export function tableNameCode(t: mm.Table): string {
  const tableName = t.__getData().name;
  const pascalName = tablePascalName(tableName);
  return `Table${pascalName}`;
}

export function agInstanceName(ag: mm.ActionGroup) {
  const typeName = ag.__getData().name;
  if (typeName.endsWith('AG')) {
    return typeName.substring(0, typeName.length - 2);
  }
  return su.toPascalCase(typeName);
}

export function tableParamName(table: mm.Table) {
  return su.toCamelCase(table.__getData().name);
}

export function actionCallPath(
  ag: mm.ActionGroup | null,
  actionName: string,
  isPrivate: boolean,
): string {
  const funcName = actionPascalName(actionName);
  const resolvedTableName = ag ? agInstanceName(ag) : core.tableObjSelf;
  return resolvedTableName + '.' + (isPrivate ? su.lowercaseFirstChar(funcName) : funcName);
}

export function cfTableVarDef(tableParamName: string) {
  return { name: tableParamName, type: types.dbxTableType };
}
