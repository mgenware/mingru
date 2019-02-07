export { default as MySQL } from './dialects/mysql';
export { default as Builder } from './builder/goBuilder';
export { default as build, IBuildOption } from './builder/build';

// IOs
import toSelectIO from './io/toSelectIO';
import toUpdateIO from './io/toUpdateIO';
import toInsertIO from './io/toInsertIO';
import toDeleteIO from './io/toDeleteIO';
import {
  SelectedColumnIO,
  JoinIO,
  SQLIO,
  SetterIO,
  TableIO,
  SelectIO,
  InsertIO,
  UpdateIO,
  DeleteIO,
} from './io/io';

// tslint:disable-next-line
export class io {
  static SelectedColumnIO = SelectedColumnIO;
  static JoinIO = JoinIO;
  static SQLIO = SQLIO;
  static SetterIO = SetterIO;
  static TableIO = TableIO;

  static SelectIO = SelectIO;
  static InsertIO = InsertIO;
  static UpdateIO = UpdateIO;
  static DeleteIO = DeleteIO;

  static toSelectIO = toSelectIO;
  static toUpdateIO = toUpdateIO;
  static toInsertIO = toInsertIO;
  static toDeleteIO = toDeleteIO;
}

export { default as dtDefault } from './builder/dtDefault';
