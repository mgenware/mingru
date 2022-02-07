import * as mm from 'mingru-models';
import post from '../models/post.js';
import user, { User } from '../models/user.js';
import { testBuildAsync } from './common.js';

it('configurableTable', async () => {
  class UserTA extends mm.TableActions {
    selectT = mm.selectRow(user.id, user.age);
    insertT = mm.insertOne().setInputs();
    updateT = mm.updateOne().setInputs().by(user.id);
    deleteT = mm.deleteOne().by(user.id);
    transactT = mm.transact(this.insertT, mm.insertOne().from(post).setInputs());
  }
  const ta = mm.tableActions(user, UserTA, { configurableTableName: 'mrFromTable' });
  await testBuildAsync(ta, 'configurable-table/from/user');
});

it('configurableTable with WRAP action', async () => {
  // Two tables with the almost same structure.
  class UserUtil extends User {}
  const userUtil = mm.table(UserUtil);
  class CommonTA extends mm.TableActions {
    insert = mm.insertOne().setInputs();
  }
  const commonTA = mm.tableActions(userUtil, CommonTA, { configurableTableName: 'mrFromTable' });

  class ConsumerTA extends mm.TableActions {
    addUser = commonTA.insert.wrap({ mrFromTable: user });
    addPost = commonTA.insert.wrap({ mrFromTable: post });
  }
  const consumerTA = mm.tableActions(post, ConsumerTA);
  await testBuildAsync(commonTA, 'configurable-table/wrap/common');
  await testBuildAsync(consumerTA, 'configurable-table/wrap/consumer');
});
