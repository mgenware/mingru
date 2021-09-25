import * as mm from 'mingru-models';
import user from './user.js';
import post from './post.js';

class PostCmt extends mm.Table {
  id = mm.pk();
  user_id = user.id;
  target_id = post.id;
  votes = mm.int().setDBName('db_votes').setModelName('model_votes');
}

export default mm.table(PostCmt);
