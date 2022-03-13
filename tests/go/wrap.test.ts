import * as mm from 'mingru-models';
import { testBuildAsync } from './common.js';
import user from '../models/user.js';
import post from '../models/post.js';

it('Wrap', async () => {
  class UserAG extends mm.ActionGroup {
    t = mm.updateOne().setInputs().by(user.id);
  }
  const userTA = mm.actionGroup(user, UserAG);
  class PostAG extends mm.ActionGroup {
    // ROOT_TABLE: post
    // TABLE: user
    s = mm
      .updateSome()
      .from(user)
      .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
      .setInputs(user.sig, user.follower_count)
      .whereSQL(
        mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.sig.toInput()} ${user.url_name.toInput()}`,
      );

    // ROOT_TABLE: post
    // TABLE: user
    t1 = this.s.wrap({ sig: '"haha"' });

    // ROOT_TABLE: post
    // TABLE: user
    t2 = userTA.t.wrap({ sig: '"SIG"' });

    // ROOT_TABLE: post
    // TABLE: post
    t3 = mm.updateOne().setInputs().by(post.id).wrap({ title: '"t3"' });
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'wrap/wrap');
});

it('`Wrap + RenameArg`', async () => {
  class UserAG extends mm.ActionGroup {
    t = mm.updateOne().setInputs().by(user.id);
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
