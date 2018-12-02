import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  url_name = dd.varChar(100).notNull;
  display_name = dd.varChar(100).notNull;
  sig = dd.varChar(300);
  age = dd.int(0).notNull;
}

export default dd.table(User);
