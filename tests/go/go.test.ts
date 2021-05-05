import * as mm from 'mingru-models';
import post from '../models/post.js';
import { testBuildAsync } from './common.js';

it('Escape string', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(post.id, post.title).whereSQL(mm.sql`${post.title} = "\\\\a\\\""`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'go/escapeString');
});
