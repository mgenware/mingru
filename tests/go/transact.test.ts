import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import { testBuildAsync } from './common';

class UserTA extends dd.TA {
  upd = dd
    .updateOne()
    .setInputs(user.url_name, user.follower_count)
    .byID();
}
const userTA = dd.ta(user, UserTA);

test('TX', async () => {
  class PostTA extends dd.TA {
    upd = dd
      .updateOne()
      .setInputs(post.title)
      .byID();
    tx = dd.transact(userTA.upd, this.upd);
  }
  const postTA = dd.ta(post, PostTA);
  await testBuildAsync(postTA, 'tx/tx');
});
