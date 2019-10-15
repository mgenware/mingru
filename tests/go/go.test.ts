import * as mm from 'mingru-models';
import post from '../models/post';
import { testBuildAsync } from './common';

it('Escape string', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .select(post.id, post.title)
      .where(mm.sql`${post.title} = "\\\\a\\\""`);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildAsync(ta, 'go/escapeString');
});
