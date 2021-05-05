import * as mm from 'mingru-models';
import post from './post.js';
import cmt from './cmt2.js';

export class PostCmt extends mm.Table {
  post_id = mm.pk(post.id);
  cmt_id = mm.pk(cmt.id);
}

export default mm.table(PostCmt);
