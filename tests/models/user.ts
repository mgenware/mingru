import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  nick = dd.varChar(100);
}

export default dd.table(User);
