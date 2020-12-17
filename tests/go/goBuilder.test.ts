import * as mm from 'mingru-models';
import { itRejects } from 'it-throws';
import user from '../models/user';
import post from '../models/post';
import { testBuildFullAsync, testBuildAsync } from './common';

it('Single action', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(post.id, post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildFullAsync(ta, 'goBuilder/singleAction');
});

it('Multiple actions', async () => {
  class PostTA extends mm.TableActions {
    selectPostTitle = mm.selectRow(post.id, post.title);
    selectPostInfo = mm.selectRow(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );

    updatePostTitle = mm.unsafeUpdateAll().set(post.title, mm.sql`${mm.input(post.title)}`);

    deleteByID = mm.deleteSome().whereSQL(mm.sql`${post.id} = ${mm.input(post.id)}`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildFullAsync(ta, 'goBuilder/multipleActions');
});

it('Action info appended to error message', async () => {
  await itRejects(async () => {
    class PostTA extends mm.TableActions {
      t = mm.unsafeInsert().setInputs(user.id);
    }
    const ta = mm.tableActions(post, PostTA);
    await testBuildAsync(ta, '');
  }, 'Source table assertion failed, expected "Table(post|db_post)", got "Table(user)". [action "post.t"]');
});
