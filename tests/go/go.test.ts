import * as dd from 'mingru-models';
import post from '../models/post';
import { testBuildAsync } from './common';

it('Escape string', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .select(post.id, post.title)
      .where(dd.sql`${post.title} = "\\\\a\\\""`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'go/escapeString');
});
