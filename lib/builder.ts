import Dialect from 'dialect';
import View from 'view';
import { throwIfFalsy } from 'throw-if-arg-empty';

export default class Builder {
  build(view: View, dialect: Dialect) {
    throwIfFalsy(view, 'view');
    throwIfFalsy(dialect, 'dialect');
    this.buildCore(view, dialect);
  }

  buildCore(_: View, __: Dialect) {
    throw new Error('Not implemented yet');
  }
}
