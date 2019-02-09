import * as dd from 'dd-models';

class User extends dd.Table {
  id = dd.pk();
  url_name = dd.varChar(100);
  display_name = dd.varChar(100);
  sig = dd.varChar(300).nullable;
  age = dd.int(0);
  follower_count = dd.varChar(300).setDBName('follower_c').nullable;
}

export default dd.table(User);
