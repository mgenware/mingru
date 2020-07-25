import * as mm from 'mingru-models';
import post from '../models/post';
import { testBuildAsync } from './common';

it('unsafeDeleteAll', async () => {
  class PostTA extends mm.TableActions {
    deleteT = mm.unsafeDeleteAll().byID();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'delete/delete');
});

it('deleteSome', async () => {
  class PostTA extends mm.TableActions {
    deleteT = mm
      .deleteSome()
      .whereSQL(mm.sql`${post.user_id} = ${mm.input(post.user_id)}`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteWithWhere');
});

it('deleteOne', async () => {
  class PostTA extends mm.TableActions {
    deleteT = mm.deleteOne().byID();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteOne');
});
