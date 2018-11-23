import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';

const dialect = new mr.MySQL();

test('inputPlaceholder', () => {
  expect(dialect.inputPlaceholder(new dd.InputParam('Type', 'name'))).toBe('?');
});

test('escapeColumn', () => {
  expect(dialect.escapeColumn(user.age)).toBe('`age`');
});

test('escapeTable', () => {
  expect(dialect.escapeTable(user)).toBe('`user`');
});
