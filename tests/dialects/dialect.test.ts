import * as mm from 'mingru-models';
import * as assert from 'assert';
import * as mr from '../..';
import user from '../models/user';

const expect = assert.equal;
const dialect = mr.mysql;

it('inputPlaceholder', () => {
  expect(dialect.inputPlaceholder(new mm.SQLVariable('Type', 'name')), '?');
});

it('encodeColumnName', () => {
  expect(dialect.encodeColumnName(user.age), '`age`');
});

it('encodeTableName', () => {
  expect(dialect.encodeTableName(user), '`user`');
});
