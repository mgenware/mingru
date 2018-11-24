import * as mr from '../../';
import * as dd from 'dd-models';

const dialect = new mr.MySQL();

test('escape', () => {
  expect(dialect.escape('abc')).toBe('`abc`');
});

test('DT', () => {
  const tests: Array<Array<unknown>> = [
    [dd.int(), 'int'],
    [dd.unsignedInt(), 'uint'],
    [dd.bigInt(), 'int64'],
    [dd.unsignedBigInt(), 'uint64'],
    [dd.pk(), 'uint64'],
    [dd.smallInt(), 'int16'],
    [dd.unsignedSmallInt(), 'uint16'],
    [dd.tinyInt(), 'int8'],
    [dd.unsignedTinyInt(), 'uint8'],
  ];

  for (const t of tests) {
    const obj = t[0] as dd.Column;
    const e = t[1] as string;
    expect(dialect.goType(obj)).toBe(e);
  }
});
