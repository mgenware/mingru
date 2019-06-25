import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';

const dialect = new mr.MySQL();

test('inputPlaceholder', () => {
  expect(dialect.inputPlaceholder(new dd.SQLVariable('Type', 'name'))).toBe(
    '?',
  );
});

test('encodeColumnName', () => {
  expect(dialect.encodeColumnName(user.age)).toBe('`age`');
});

test('encodeTableName', () => {
  expect(dialect.encodeTableName(user)).toBe('`user`');
});
