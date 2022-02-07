import * as mm from 'mingru-models';
import { VarInfo, AtomicTypeInfo, typeInfoToPointer } from '../lib/varInfo.js';
import * as def from './core.js';

export const errorType = new AtomicTypeInfo('error', null, null);
export const intTypeInfo = new AtomicTypeInfo('int', 0, null);
export const uint64TypeInfo = new AtomicTypeInfo('uint64', 0, null);
export const boolTypeInfo = new AtomicTypeInfo('bool', false, null);
export const stringTypeInfo = new AtomicTypeInfo('string', '', null);

export const sqlDBType = typeInfoToPointer(new AtomicTypeInfo('DB', null, 'sql|database/sql'));
export const sqlTxType = typeInfoToPointer(new AtomicTypeInfo('Tx', null, 'sql|database/sql'));
export const dbxQueryableType = new AtomicTypeInfo('Queryable', null, def.dbxNamespace);
export const dbxQueryableVar = new VarInfo(def.mrQueryableParam, dbxQueryableType);
export const sqlDBVar = new VarInfo(def.dbParam, sqlDBType);
export const insertedIDVar = new VarInfo(mm.ReturnValues.insertedID, uint64TypeInfo);
export const selectActionMaxVar = new VarInfo(def.maxVarName, intTypeInfo);
export const pageVar = new VarInfo(def.pageVarName, intTypeInfo);
export const pageSizeVar = new VarInfo(def.pageSizeVarName, intTypeInfo);
export const hasNextVar = new VarInfo(def.hasNextVarName, boolTypeInfo);

export const dbxTableType = new AtomicTypeInfo('Table', null, def.dbxNamespace);
