import * as dd from 'dd-models';
import user from './user';

class PostReply extends dd.Table {
  id = dd.pk();
  user_id = user.id;
  to_user_id = user.id;
}

export default dd.table(PostReply, 'post_cmt_rpl');
