import * as dd from 'dd-models';
import user from './user';
import post from './post';

class PostCmt extends dd.Table {
  id = dd.pk();
  user_id = user.id;
  target_id = post.id;
  content = dd.text().notNull;
}

export default dd.table(PostCmt);
