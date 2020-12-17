import * as mm from 'mingru-models';
import post from '../models/post';
import user from '../models/user';
import { testBuildAsync } from './common';

it('FROM table as input', async () => {
  class UserTA extends mm.TableActions {
    selectT = mm.selectRow(user.id, user.age);
    insertT = mm.insertOne().setInputs();
    updateT = mm.updateOne().setInputs().by(user.id);
    deleteT = mm.deleteOne().by(user.id);
    transactT = mm.transact(this.insertT, mm.insertOne().from(post).setInputs());
  }
  const ta = mm.tableActions(user, UserTA, { unsafeTableInput: true });
  await testBuildAsync(ta, 'from-table-input/from/user');
});

it('WRAP action', async () => {
  // Two tables with almost same structure.
  class UserT extends mm.Table {
    id = mm.pk();
    t_id = user.id;
  }
  const userT = mm.table(UserT);
  class PostT extends mm.Table {
    id = mm.pk();
    t_id = user.id;
  }
  const postT = mm.table(PostT);
  class CommonTA extends mm.TableActions {
    insert = mm.insertOne().setInputs();
  }
  const commonTA = mm.tableActions(userT, CommonTA, { unsafeTableInput: true });

  class ConsumerTA extends mm.TableActions {
    addUser = commonTA.insert.wrap({ table: userT });
    addPost = commonTA.insert.wrap({ table: postT });
  }
  const consumerTA = mm.tableActions(post, ConsumerTA);
  await testBuildAsync(commonTA, 'from-table-input/wrap/common');
  await testBuildAsync(consumerTA, 'from-table-input/wrap/consumer');
});
