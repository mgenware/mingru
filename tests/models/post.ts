import * as mm from 'mingru-models';
import user from './user.js';

export class Post extends mm.Table {
  id = mm.pk();
  title = mm.varChar(100);
  content = mm.varChar(100);
  user_id = user.id;
  reviewer_id = user.id;
  cmtCount = mm.uInt().default(0).setDBName('cmt_c');

  datetime = mm.datetime();
  date = mm.date();
  time = mm.time();
  n_datetime = mm.datetime().nullable;
  n_date = mm.date().nullable;
  n_time = mm.time().nullable;
  m_user_id = mm.fk(user.id).setDBName('my_user_id');
}

export default mm.table(Post, { dbName: 'db_post' });
