import VarInfo, { TypeInfo } from './lib/varInfo';

export const queryableParam = 'queryable';
export const dbParam = 'db';
export const sqlDBType = new TypeInfo('*sql.DB', 'database/sql');
export const sqlTxType = new TypeInfo('*sql.Tx', 'database/sql');
export const dbxQueryableType = new TypeInfo(
  'dbx.Queryable',
  'github.com/mgenware/go-packagex/v5/dbx',
);
export const dbxQueryableVar = new VarInfo(queryableParam, dbxQueryableType);
export const sqlDBVar = new VarInfo(dbParam, sqlDBType);
