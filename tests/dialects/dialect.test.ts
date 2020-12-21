import * as mr from '../..';
import user from '../models/user';
import { deepEq, eq } from '../assert-aliases';

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
