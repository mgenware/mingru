// import * as dd from 'dd-models';
// import Dialect from '../dialect';

// export default class CreateBuilder {
//   constructor(public table: dd.Table, public dialect: Dialect) {}

//   build(): string {
//     const { table, dialect } = this;
//     const columns = table.__columns;
//     const body = [];

//     for (const col of columns) {
//       body.push(`${dialect.escapeColumn(col)} ${dialect.colTypeToSQLType(col.type)}`);
//     }
//     const code = `CREATE TABLE ${table.getDBName()} {\n`;
//     return body + code;
//   }
// }
