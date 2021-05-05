import * as mm from 'mingru-models';
import post from './post.js';
import category from './category.js';

class PostCategory extends mm.Table {
  post_id = post.id;
  category_id = category.id;
}

export default mm.table(PostCategory);
