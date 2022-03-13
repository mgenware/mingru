import * as mm from 'mingru-models';
import cols from '../models/cols.js';
import post from '../models/post.js';
import { testBuildAsync } from './common.js';

it('Ghost table', async () => {
  class Ghost extends mm.GhostTable {}
  const ghost = mm.table(Ghost);
  class GhostTA extends mm.ActionGroup {
    selectT = mm.selectRows(post.id, post.title).from(post).orderByAsc(post.id);
    insertT = mm.insert().from(cols).setInputs(cols.fk).setDefaults();
  }
  const ta = mm.actionGroup(ghost, GhostTA);
  await testBuildAsync(ta, 'misc/ghostTable');
});
