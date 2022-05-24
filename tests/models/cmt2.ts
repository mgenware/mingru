import * as mm from 'mingru-models';
import user from './user.js';

export class Cmt extends mm.Table {
  id = mm.pk();
  content = mm.text();
  user_id = user.id;

  created_at = mm.datetime({ defaultToNow: 'server' });
  modified_at = mm.datetime({ defaultToNow: 'server' });
  rpl_count = mm.uInt();
}

export default mm.table(Cmt);
