import Dialect from '../dialect';

export default class MySQL extends Dialect {
  escapeName(name: string): string {
    return '`' + name + '`';
  }
}
