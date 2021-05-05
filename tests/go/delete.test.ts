import * as mm from 'mingru-models';
import post from '../models/post.js';
import { testBuildAsync } from './common.js';

it('unsafeDeleteAll', async () => {
  class PostTA extends mm.TableActions {
    deleteT = mm.unsafeDeleteAll().by(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'delete/delete');
});

it('deleteSome', async () => {
  class PostTA extends mm.TableActions {
    deleteT = mm.deleteSome().whereSQL(mm.sql`${post.user_id} = ${mm.input(post.user_id)}`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteWithWhere');
});

it('deleteOne', async () => {
  class PostTA extends mm.TableActions {
    deleteT = mm.deleteOne().by(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteOne');
});
