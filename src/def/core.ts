import { fromTableParamName } from './pub.js';

export const mrQueryableParam = 'mrQueryable';
export const dbParam = 'db';
export const limitVarName = 'limit';

export const dbxNamespace = 'mingru|github.com/mgenware/mingru-go-lib';
export const maxVarName = 'max';
export const pageVarName = 'page';
export const pageSizeVarName = 'pageSize';
export const hasNextVarName = 'hasNext';

export const resultVarName = 'result';
export const itemVarName = 'item';
export const fileHeader = `/${'*'.repeat(90)}
 * This file was automatically generated by mingru (https://github.com/mgenware/mingru)
 * Do not edit this file manually, your changes will be overwritten.
 ${'*'.repeat(90)}/

`;

export const defaultPackageName = 'da';
export const fmtImport = 'fmt';
export const queryParamsVarName = 'queryParams';

// The function name of `mingru.Table` used to get the table name.
export const tableMemSQLName = 'MingruSQLName';
// The generated Go code used to get the table name from "FROM as input" table param.
export const getFromTableCode = `${fromTableParamName}.${tableMemSQLName}()`;
// The current instance name of a generated table member function.
export const tableObjSelf = 'mrTable';
