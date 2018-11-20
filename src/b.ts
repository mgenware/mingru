import * as dd from 'dd-models';
import select from './io/select';
import GoBuilder from './builder/goBuilder';
import MySQL from './dialects/mysql';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
  age = dd.int(0);
}

const user = dd.table(User);

const actions = dd.actions(user);
const v = actions.select('name', user.name);
actions.select('age', user.age);

const dialect = new MySQL();

const io = select(v, dialect);
const b = new GoBuilder(dialect);
const code = b.select(io);
console.log(code);
