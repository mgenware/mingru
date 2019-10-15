import * as mm from 'mingru-models';
import user from './user';
import post from './post';

class PostCmt extends mm.Table {
  id = mm.pk();
  user_id = user.id;
  target_id = post.id;
}

export default mm.table(PostCmt);
