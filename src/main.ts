export { default as MySQL } from './dialects/mysql';
export { default as select } from './io/select';
export { default as update } from './io/update';
export { default as Builder } from './builder/goBuilder';

// IOs
import {
  ColumnIO,
  JoinIO,
  MainAlias,
  SQLIO,
  SetterIO,
  TableIO,
} from './io/io';

// tslint:disable-next-line
export class io {
  static ColumnIO = ColumnIO;
  static JoinIO = JoinIO;
  static MainAlias = MainAlias;
  static SQLIO = SQLIO;
  static SetterIO = SetterIO;
  static TableIO = TableIO;
}
