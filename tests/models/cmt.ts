import * as dd from 'mingru-models';
import user from './user';
import post from './post';

class PostCmt extends dd.Table {
  id = dd.pk();
  user_id = user.id;
  target_id = post.id;
}

export default dd.table(PostCmt);
