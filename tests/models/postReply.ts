import * as dd from 'mingru-models';
import user from './user';

class PostReply extends dd.Table {
  id = dd.pk();
  user_id = user.id;
  to_user_id = user.id;
  custom_id = dd.uBigInt().setDBName('haha');
}

export default dd.table(PostReply, 'post_cmt_rpl');
