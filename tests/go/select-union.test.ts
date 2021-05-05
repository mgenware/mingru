import * as mm from 'mingru-models';
import like from '../models/like.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { testBuildAsync } from './common.js';

it('UNION', async () => {
  class Activity extends mm.GhostTable {}
  const activity = mm.table(Activity);
  class ActivityTA extends mm.TableActions {
    t = mm
      .selectRow(user.id, user.sig.as('generic_sig'), user.url_name.as('generic_name'))
      .from(user)
      .by(user.id)
      .union(mm.selectRow(post.id, post.title).from(post).by(post.id, 'postID'))
      .unionAll(mm.selectRows(like.user_id, like.value).from(like))
      .orderByAsc(user.id);
  }
  const ta = mm.tableActions(activity, ActivityTA);

  await testBuildAsync(ta, 'select-union/union');
});

it('UNION starting from another member', async () => {
  class Activity extends mm.GhostTable {}
  const activity = mm.table(Activity);
  class ActivityTA extends mm.TableActions {
    privateT = mm
      .selectRow(user.id, user.sig.as('generic_sig'), user.url_name.as('generic_name'))
      .from(user)
      .by(user.id);

    t = this.privateT
      .union(mm.selectRow(post.id, post.title).from(post).by(post.id, 'postID'))
      .unionAll(mm.selectRows(like.user_id, like.value).from(like))
      .orderByAsc('generic_sig');
  }
  const ta = mm.tableActions(activity, ActivityTA);

  await testBuildAsync(ta, 'select-union/unionWithReusedMem');
});

it('UNION with LIMIT n OFFSET', async () => {
  class Activity extends mm.GhostTable {}
  const activity = mm.table(Activity);
  class ActivityTA extends mm.TableActions {
    t1 = mm
      .selectRows(user.id, user.sig.as('generic_sig'), user.url_name.as('generic_name'))
      .from(user)
      .by(user.id)
      .orderByAsc(user.id)
      .paginate();

    t2 = mm.selectRows(post.title).from(post).by(post.id).orderByAsc(post.id);

    t = this.t1
      .unionAll(mm.selectRows(like.user_id, like.value).from(like))
      .union(this.t2)
      .orderByAsc(user.id)
      .paginate();
  }
  const ta = mm.tableActions(activity, ActivityTA);

  await testBuildAsync(ta, 'select-union/unionLimitOffset');
});

it('UNION with page mode', async () => {
  class Activity extends mm.GhostTable {}
  const activity = mm.table(Activity);
  class ActivityTA extends mm.TableActions {
    t1 = mm
      .selectRows(user.id, user.sig.as('generic_sig'), user.url_name.as('generic_name'))
      .pageMode()
      .from(user)
      .by(user.id)
      .orderByAsc(user.id);

    t2 = mm.selectRows(post.title).from(post).by(post.id).orderByAsc(post.id);

    t = this.t1
      .unionAll(mm.selectRows(like.user_id, like.value).from(like))
      .union(this.t2)
      .pageMode()
      .orderByAsc(user.id);
  }
  const ta = mm.tableActions(activity, ActivityTA);

  await testBuildAsync(ta, 'select-union/unionPageMode');
});
