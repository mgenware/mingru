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
      .by(user.id)
      .union(
        mm
          .select(post.id, post.title)
          .from(post)
          .by(post.id, 'postID')
          .unionAll(mm.selectRows(like.user_id, like.value).from(like)),
      );
  }
  const ta = mm.tableActions(activity, ActivityTA);

  await testBuildAsync(ta, 'select-union/union');
});

it('UNION starting from another member', async () => {
  class Activity extends mm.GhostTable {}
  const activity = mm.table(Activity);
  class ActivityTA extends mm.TableActions {
    #privateT = mm
      .select(user.id, user.sig.as('generic_sig'), user.url_name.as('generic_name'))
      .from(user)
      .by(user.id)
      .privateAttr();

    t = this.#privateT.union(
      mm
        .select(post.id, post.title)
        .from(post)
        .by(post.id, 'postID')
        .unionAll(mm.selectRows(like.user_id, like.value).from(like)),
    );
  }
  const ta = mm.tableActions(activity, ActivityTA);

  await testBuildAsync(ta, 'select-union/unionAnotherMember');
});
