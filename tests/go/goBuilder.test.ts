import * as dd from 'mingru-models';
import user from '../models/user';
import post from '../models/post';
import { testBuildFullAsync } from './common';

it('Single action', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.select(post.id, post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildFullAsync(ta, 'goBuilder/singleAction');
});

it('Multiple actions', async () => {
  class PostTA extends dd.TableActions {
    selectPostTitle = dd.select(post.id, post.title);
    selectPostInfo = dd.select(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );
    updatePostTitle = dd
      .unsafeUpdateAll()
      .set(post.title, dd.sql`${dd.input(post.title)}`);
    deleteByID = dd
      .deleteSome()
      .where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildFullAsync(ta, 'goBuilder/multipleActions');
});
