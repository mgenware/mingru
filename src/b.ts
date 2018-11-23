import * as dd from 'dd-models';
import GoBuilder from './builder/goBuilder';
import MySQL from './dialects/mysql';

class User extends dd.Table {
  id = dd.pk();
  name = dd.varChar(100);
  age = dd.int(0);
}

const user = dd.table(User);

const actions = dd.actions(user);
actions.select('name', user.name)
  .where(dd.sql`${user.id}=${dd.input(user.id)}`);

const dialect = new MySQL();

const b = new GoBuilder(dialect, actions);
const code = b.build();
console.log(code);
