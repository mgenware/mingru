import * as dd from 'dd-models';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  title = dd.varChar(100).notNull;
  content = dd.varChar(100).notNull;
  user_id = user.id;
  reviewer_id = user.id;
  cmtCount = dd.setName('cmt_c', dd.unsignedInt(0).notNull);
}

export default dd.table(Post);
