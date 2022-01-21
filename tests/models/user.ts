import * as mm from 'mingru-models';

export class User extends mm.Table {
  id = mm.pk();
  url_name = mm.varChar(100);
  display_name = mm.varChar(100);
  sig = mm.varChar(300).nullable;
  age = mm.int().default(0);
  follower_count = mm.varChar(300).setDBName('follower_c').nullable;
}

export default mm.table(User);
