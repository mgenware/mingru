import * as mm from 'mingru-models';
import { testBuildAsync } from './common';
import user from '../models/user';
import post from '../models/post';

it('Wrap', async () => {
  class UserTA extends mm.TableActions {
    t = mm.updateOne().setInputs().byID();
  }
  const userTA = mm.tableActions(user, UserTA);
  class PostTA extends mm.TableActions {
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
    t3 = mm.updateOne().setInputs().byID().wrap({ title: '"t3"' });
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'wrap/wrap');
});
