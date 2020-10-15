import * as mm from 'mingru-models';
import like from '../models/like';
import post from '../models/post';
import user from '../models/user';
import { testBuildAsync } from './common';

it('UNION', async () => {
  class Activity extends mm.GhostTable {}
  const activity = mm.table(Activity);
  class ActivityTA extends mm.TableActions {
    t = mm
      .select(user.id, user.sig.as('generic_sig'), user.url_name.as('generic_name'))
      .from(user)
      .byID()
      .union(mm.select().from(post).byID().unionAll(mm.select().from(like).byID()));
  }
  const ta = mm.tableActions(activity, ActivityTA);

  await testBuildAsync(ta, 'select-union/union');
});
