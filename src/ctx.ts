import { MySQL } from './dialects/mysql.js';

class Context {
  dialect = new MySQL();
}

export default new Context();
