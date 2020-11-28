import * as mm from 'mingru-models';
import * as mr from '../..';
import user from '../models/user';
import { deepEq, eq } from '../assert-aliases';

const dialect = mr.mysql;

it('inputPlaceholder', () => {
  deepEq(
    dialect.inputPlaceholder(new mm.SQLVariable({ type: 'Type', defaultValue: null }, 'name')),
    ['?'],
  );
});

it('encodeColumnName', () => {
  eq(dialect.encodeColumnName(user.age), '`age`');
});

it('encodeTableName', () => {
  eq(dialect.encodeTableName(user), '`user`');
});
