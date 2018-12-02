import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  display_name = dd.varChar(200).notNull;
  url_name = dd.varChar(200).notNull;
  sig = dd.varChar(300);
}

export default dd.table(User);
