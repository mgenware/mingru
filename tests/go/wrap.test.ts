import * as mm from 'mingru-models';
import { testBuildAsync } from './common.js';
import user from '../models/user.js';
import post from '../models/post.js';

it('Wrap', async () => {
  class UserAG extends mm.ActionGroup {
    t = mm.updateOne().setParams().by(user.id);
  }
  const userTA = mm.actionGroup(user, UserAG);
  class PostAG extends mm.ActionGroup {
    // ROOT_TABLE: post
    // TABLE: user
    s = mm
      .updateSome()
      .from(user)
      .set(user.url_name, mm.sql`${mm.param(user.url_name)}`)
      .setParams(user.sig, user.follower_count)
      .whereSQL(
        mm.sql`${user.url_name.toParam()} ${user.id.toParam()} ${user.sig.toParam()} ${user.url_name.toParam()}`,
      );

    // ROOT_TABLE: post
    // TABLE: user
    t1 = this.s.wrap({ sig: '"haha"' });

    // ROOT_TABLE: post
    // TABLE: user
    t2 = userTA.t.wrap({ sig: '"SIG"' });

    // ROOT_TABLE: post
    // TABLE: post
    t3 = mm.updateOne().setParams().by(post.id).wrap({ title: '"t3"' });
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'wrap/wrap');
});

it('`Wrap + RenameArg`', async () => {
  class UserAG extends mm.ActionGroup {
    t = mm.updateOne().setParams().by(user.id);
  }
  const userTA = mm.actionGroup(user, UserAG);
  class PostAG extends mm.ActionGroup {
    a = userTA.t;
    b = userTA.t.wrap({ sig: mm.renameArg('renamed') });
  }
  const postTA = mm.actionGroup(post, PostAG);
  await testBuildAsync(userTA, 'wrap/renameArg/user_ag');
  await testBuildAsync(postTA, 'wrap/renameArg/post_ag');
});
