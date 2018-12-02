import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  url_name = dd.varChar(100).notNull;
  sig = dd.varChar(300);
}

export default dd.table(User);
