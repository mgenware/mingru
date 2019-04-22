import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync } from './common';

test('unsafeDeleteAll', async () => {
  class PostTA extends dd.TA {
    deleteT = dd.unsafeDeleteAll().byID();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'delete/delete');
});

test('deleteSome', async () => {
  class PostTA extends dd.TA {
    deleteT = dd
      .deleteSome()
      .where(dd.sql`${post.user_id} = ${dd.input(post.user_id)}`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteWithWhere');
});

test('deleteOne', async () => {
  class PostTA extends dd.TA {
    deleteT = dd.deleteOne().byID();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'delete/deleteOne');
});
