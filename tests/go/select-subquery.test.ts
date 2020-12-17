import * as mm from 'mingru-models';
import post from '../models/post';
import user from '../models/user';
import { testBuildAsync } from './common';

it('WHERE', async () => {
  class PostTA extends mm.TableActions {
    t = mm.selectRow(post.title).where`${post.user_id.isEqualTo`${mm
      .selectRow(mm.max(user.id).toColumn('maxID'))
      .from(user)}`}`;
  }
  const ta = mm.tableActions(post, PostTA);

  await testBuildAsync(ta, 'select-sq/where');
});
