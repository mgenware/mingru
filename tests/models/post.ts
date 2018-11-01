import * as dd from 'dd-models';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  title = dd.varChar(100);
  user_id = user.id;
  reviewer_id = user.id;
}

export default dd.table(Post);
