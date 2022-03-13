import * as mm from 'mingru-models';
import post from '../models/post.js';
import { testBuildAsync } from './common.js';

it('Escape string', async () => {
  class PostAG extends mm.ActionGroup {
    selectT = mm.selectRow(post.id, post.title).whereSQL(mm.sql`${post.title} = "\\\\a\\\""`);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'go/escapeString');
});
