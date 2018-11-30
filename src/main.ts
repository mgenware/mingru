export { default as MySQL } from './dialects/mysql';
export { default as Builder } from './builder/goBuilder';

// IOs
import toSelectIO from './io/toSelectIO';
import toUpdateIO from './io/toUpdateIO';
import toInsertIO from './io/toInsertIO';
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

  static toSelectIO = toSelectIO;
  static toUpdateIO = toUpdateIO;
  static toInsertIO = toInsertIO;
}
