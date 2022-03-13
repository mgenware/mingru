import * as mm from 'mingru-models';
import post from '../models/post.js';
import user from '../models/user.js';
import { testBuildAsync } from './common.js';

it('WHERE', async () => {
  class PostAG extends mm.ActionGroup {
    t = mm.selectRow(post.title).where`${post.user_id.isEqualTo`${mm
      .selectRow(mm.max(user.id).toColumn('maxID'))
      .from(user)}`}`;
  }
  const ta = mm.actionGroup(post, PostAG);

  await testBuildAsync(ta, 'select-sq/where');
});
