import * as mm from 'mingru-models';
import * as assert from 'assert';
import * as mr from '../..';
import user from '../models/user';

const eq = assert.equal;
const dialect = mr.mysql;

it('inputPlaceholder', () => {
  eq(
    dialect.inputPlaceholder(
      new mm.SQLVariable({ name: 'Type', defaultValue: null }, 'name'),
    ),
    '?',
  );
});

it('encodeColumnName', () => {
  eq(dialect.encodeColumnName(user.age), '`age`');
});

it('encodeTableName', () => {
  eq(dialect.encodeTableName(user), '`user`');
});
