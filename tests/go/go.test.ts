import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync } from './common';

test('Escape string', async () => {
  class PostTA extends dd.TA {
    selectT = dd
      .select(post.id, post.title)
      .where(dd.sql`${post.title} = "\\\\a\\\""`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'go/escapeString');
});
