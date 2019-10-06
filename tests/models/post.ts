import * as dd from 'mingru-models';
import user from './user';

class Post extends dd.Table {
  id = dd.pk();
  title = dd.varChar(100);
  content = dd.varChar(100);
  user_id = user.id;
  reviewer_id = user.id;
  cmtCount = dd.uInt(0).setDBName('cmt_c');

  datetime = dd.datetime();
  date = dd.date();
  time = dd.time();
  n_datetime = dd.datetime().nullable;
  n_date = dd.date().nullable;
  n_time = dd.time().nullable;
  m_user_id = dd.fk(user.id).setDBName('my_user_id');
}

export default dd.table(Post, 'db_post');
