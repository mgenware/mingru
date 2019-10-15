import * as mm from 'mingru-models';
import user from '../models/user';
import post from '../models/post';
import { testBuildFullAsync } from './common';

it('Single action', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.select(post.id, post.title);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildFullAsync(ta, 'goBuilder/singleAction');
});

it('Multiple actions', async () => {
  class PostTA extends mm.TableActions {
    selectPostTitle = mm.select(post.id, post.title);
    selectPostInfo = mm.select(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );
    updatePostTitle = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`${mm.input(post.title)}`);
    deleteByID = mm
      .deleteSome()
      .where(mm.sql`${post.id} = ${mm.input(post.id)}`);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildFullAsync(ta, 'goBuilder/multipleActions');
});
