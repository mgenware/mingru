import * as dd from 'mingru-models';
import post from '../models/post';
import { testBuildAsync } from './common';

it('unsafeDeleteAll', async () => {
  class PostTA extends dd.TableActions {
    deleteT = dd.unsafeDeleteAll().byID();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'delete/delete');
});

it('deleteSome', async () => {
  class PostTA extends dd.TableActions {
    deleteT = dd
      .deleteSome()
      .where(dd.sql`${post.user_id} = ${dd.input(post.user_id)}`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteWithWhere');
});

it('deleteOne', async () => {
  class PostTA extends dd.TableActions {
    deleteT = dd.deleteOne().byID();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteOne');
});
