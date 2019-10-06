import * as mr from '../../';
import * as dd from 'mingru-models';
import user from '../models/user';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = mr.mysql;

it('inputPlaceholder', () => {
  expect(dialect.inputPlaceholder(new dd.SQLVariable('Type', 'name')), '?');
});

it('encodeColumnName', () => {
  expect(dialect.encodeColumnName(user.age), '`age`');
});

it('encodeTableName', () => {
  expect(dialect.encodeTableName(user), '`user`');
});
