import * as mm from 'mingru-models';
import { itRejects } from 'it-throws';
import user from '../models/user.js';
import post from '../models/post.js';
import { testBuildFullAsync, testBuildAsync } from './common.js';

it('Single action', async () => {
  class PostAG extends mm.ActionGroup {
    selectT = mm.selectRow(post.id, post.title);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildFullAsync(ta, 'goBuilder/singleAction');
});

it('Multiple actions', async () => {
  class PostAG extends mm.ActionGroup {
    selectPostTitle = mm.selectRow(post.id, post.title);
    selectPostInfo = mm.selectRow(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );

    updatePostTitle = mm.unsafeUpdateAll().set(post.title, mm.sql`${mm.param(post.title)}`);

    deleteByID = mm.deleteSome().whereSQL(mm.sql`${post.id} = ${mm.param(post.id)}`);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildFullAsync(ta, 'goBuilder/multipleActions');
});

it('Action info appended to error message', async () => {
  await itRejects(async () => {
    class PostAG extends mm.ActionGroup {
      t = mm.unsafeInsert().setParams(user.id);
    }
    const ta = mm.actionGroup(post, PostAG);
    await testBuildAsync(ta, '');
  }, 'Source table assertion failed, expected "Post(post, db=db_post)", got "User(user)". [action "post.t"]');
});
