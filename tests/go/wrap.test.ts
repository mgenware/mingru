import * as dd from 'dd-models';
import { testBuildAsync } from './common';
import user from '../models/user';
import post from '../models/post';

it('Wrap', async () => {
  class UserTA extends dd.TA {
    t = dd
      .updateOne()
      .setInputs()
      .byID();
  }
  const userTA = dd.ta(user, UserTA);
  class PostTA extends dd.TA {
    s = dd
      .updateSome()
      .set(user.url_name, dd.sql`${dd.input(user.url_name)}`)
      .setInputs(user.sig, user.follower_count)
      .where(
        dd.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.sig.toInput()} ${user.url_name.toInput()}`,
      );
    t1 = this.s.wrap({ sig: '"haha"' });
    t2 = userTA.t.wrap({ sig: '"SIG"' });
    t3 = dd
      .updateOne()
      .setInputs()
      .byID()
      .wrap({ title: '"t3"' });
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'wrap/wrap');
});
