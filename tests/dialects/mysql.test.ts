import * as mr from '../..';

const dialect = new mr.MySQL();

test('escape', () => {
  expect(dialect.escape('abc')).toBe('`abc`');
});
