import Dialect from '../dialect';

export default class MySQL extends Dialect {
  escape(name: string): string {
    return '`' + name + '`';
  }
}
