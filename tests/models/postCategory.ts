import * as dd from 'mingru-models';
import post from './post';
import category from './category';

class PostCategory extends dd.Table {
  post_id = post.id;
  category_id = category.id;
}

export default dd.table(PostCategory);
