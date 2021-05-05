import * as mr from '../../dist/main.js';
import user from '../models/user.js';
import { deepEq, eq } from '../assert-aliases.js';

const dialect = mr.mysql;

it('inputPlaceholder', () => {
  deepEq(dialect.inputPlaceholder(), ['?']);
});

it('encodeColumnName', () => {
  eq(dialect.encodeColumnName(user.age), '`age`');
});

it('encodeTableName', () => {
  eq(dialect.encodeTableName(user), '`user`');
});
