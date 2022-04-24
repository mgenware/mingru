import * as mm from 'mingru-models';
import { VarDef, AtomicTypeInfo, typeInfoToPointer } from '../lib/varInfo.js';
import * as def from './core.js';

export const errorType = new AtomicTypeInfo('error', null, null);
export const errorVar: VarDef = { name: 'err', type: errorType };
export const intTypeInfo = new AtomicTypeInfo('int', 0, null);
export const uint64TypeInfo = new AtomicTypeInfo('uint64', 0, null);
export const boolTypeInfo = new AtomicTypeInfo('bool', false, null);
export const stringTypeInfo = new AtomicTypeInfo('string', '', null);

export const sqlDBType = typeInfoToPointer(new AtomicTypeInfo('DB', null, 'sql|database/sql'));
export const sqlTxType = typeInfoToPointer(new AtomicTypeInfo('Tx', null, 'sql|database/sql'));
export const dbxQueryableType = new AtomicTypeInfo('Queryable', null, def.dbxNamespace);
export const dbxQueryableVar: VarDef = { name: def.mrQueryableParam, type: dbxQueryableType };
export const sqlDBVar: VarDef = { name: def.dbParam, type: sqlDBType };
export const insertedIDVar: VarDef = { name: mm.ReturnValues.insertedID, type: uint64TypeInfo };
export const selectActionMaxVar: VarDef = { name: def.maxVarName, type: intTypeInfo };
export const pageVar: VarDef = { name: def.pageVarName, type: intTypeInfo };
export const pageSizeVar: VarDef = { name: def.pageSizeVarName, type: intTypeInfo };
export const hasNextVar: VarDef = { name: def.hasNextVarName, type: boolTypeInfo };
