import * as mm from 'mingru-models';
import user from './user.js';

class PostReply extends mm.Table {
  id = mm.pk();
  user_id = user.id;
  to_user_id = user.id;
  custom_id = mm.uBigInt().setDBName('haha');
  created = mm.datetime();
}

export default mm.table(PostReply, { dbName: 'post_cmt_rpl' });
