import * as su from '../lib/stringUtils.js';
import * as core from './core.js';
import * as types from './types.js';
import { VarInfo } from '../lib/varInfo.js';

export function tablePascalName(tableName: string): string {
  return su.toPascalCase(tableName);
}

export function actionPascalName(actionName: string): string {
  return su.toPascalCase(actionName);
}

export function paginateCoreFuncName(name: string): string {
  return `${name}Core`;
}

export function tableTypeName(tableName: string): string {
  return `TableType${tablePascalName(tableName)}`;
}

export function tableInstanceName(tableName: string): string {
  return tablePascalName(tableName);
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

// Gets the generated Go code to get table name from configurable table param..
export function cfTableUsageCode(tableParamName: string) {
  return `${tableParamName}.${core.tableMemSQLName}()`;
}

export function cfTableVarInfo(tableParamName: string) {
  return new VarInfo(tableParamName, types.dbxTableType);
}
