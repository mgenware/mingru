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

export function agName(ag: mm.ActionGroup) {
  const typeName = ag.constructor.name;
  if (typeName.endsWith('AG')) {
    return typeName.substring(0, typeName.length - 2);
  }
  return typeName;
}

export function actionCallPath(
  className: string | null,
  actionName: string,
  isPrivate: boolean,
): string {
  const funcName = actionPascalName(actionName);
  const resolvedTableName = className ? tablePascalName(className) : core.tableObjSelf;
  return resolvedTableName + '.' + (isPrivate ? su.lowercaseFirstChar(funcName) : funcName);
}

export function cfTableVarDef(tableParamName: string) {
  return { name: tableParamName, type: types.stringTypeInfo };
}
