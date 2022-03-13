import * as mm from 'mingru-models';
import post from '../models/post.js';
import user, { User } from '../models/user.js';
import { testBuildAsync } from './common.js';

it('configurableTable', async () => {
  class UserAG extends mm.ActionGroup {
    selectT = mm.selectRow(user.id, user.age);
    insertT = mm.insertOne().setInputs();
    updateT = mm.updateOne().setInputs().by(user.id);
    deleteT = mm.deleteOne().by(user.id);
    transactT = mm.transact(this.insertT, mm.insertOne().from(post).setInputs());
  }
  const ta = mm.actionGroup(user, UserAG, { configurableTableName: 'mrFromTable' });
  await testBuildAsync(ta, 'configurable-table/from/user');
});

it('configurableTable with WRAP action', async () => {
  // Two tables with the almost same structure.
  class UserUtil extends User {}
  const userUtil = mm.table(UserUtil, { virtualTable: true });
  class CommonAG extends mm.ActionGroup {
    insert = mm.insertOne().setInputs();
    del = mm.deleteOne().by(userUtil.id);
    upd = mm.updateOne().setInputs().by(userUtil.id);
    sel = mm.selectRows(userUtil.display_name).by(userUtil.id).orderByAsc(userUtil.display_name);
  }
  const commonTA = mm.actionGroup(userUtil, CommonAG, { configurableTableName: 'mrFromTable' });

  class ConsumerAG extends mm.ActionGroup {
    addUser = commonTA.insert.wrap({ mrFromTable: user });
    addPost = commonTA.insert.wrap({ mrFromTable: post });
    delPost = commonTA.del.wrap({ mrFromTable: post });
    updPost = commonTA.upd.wrap({ mrFromTable: post });
    selPost = commonTA.sel.wrap({ mrFromTable: post });
  }
  const consumerTA = mm.actionGroup(post, ConsumerAG);
  await testBuildAsync(commonTA, 'configurable-table/wrap/common');
  await testBuildAsync(consumerTA, 'configurable-table/wrap/consumer');
});

it('configurableTable with WRAP action inside transactions', async () => {
  // Two tables with the almost same structure.
  class UserUtil extends User {}
  const userUtil = mm.table(UserUtil, { virtualTable: true });
  class CommonAG extends mm.ActionGroup {
    insert = mm.insertOne().setInputs();
    del = mm.deleteOne().by(userUtil.id);
    upd = mm.updateOne().setInputs().by(userUtil.id);
    sel = mm.selectRows(userUtil.display_name).by(userUtil.id).orderByAsc(userUtil.display_name);
  }
  const commonTA = mm.actionGroup(userUtil, CommonAG, { configurableTableName: 'mrFromTable' });

  class ConsumerAG extends mm.ActionGroup {
    tx = mm.transact(
      commonTA.insert.wrap({ mrFromTable: user }),
      commonTA.del,
      commonTA.upd,
      commonTA.sel,
    );

    wrapped = this.tx.wrap({ mrFromTable: post });
  }
  const consumerTA = mm.actionGroup(post, ConsumerAG);
  await testBuildAsync(commonTA, 'configurable-table/wrap-tx/common');
  await testBuildAsync(consumerTA, 'configurable-table/wrap-tx/consumer');
});

it('Call a table action with configurable table that has not been initialized', async () => {
  class UserUtil extends User {
    id = mm.pk();
  }
  const userUtil = mm.table(UserUtil, { virtualTable: true });

  class UserUtilAG extends mm.ActionGroup {
    t = mm.updateOne().setInputs().by(userUtil.id);
  }
  const userUtilTA = mm.actionGroup(userUtil, UserUtilAG, { configurableTableName: 'cname' });

  class PostAG extends mm.ActionGroup {
    t = userUtilTA.t.wrap({ cname: post });
  }
  const postTA = mm.actionGroup(post, PostAG);
  // Build post TA first.
  await testBuildAsync(postTA, 'configurable-table/static-ta/post');
  await testBuildAsync(userUtilTA, 'configurable-table/static-ta/userUtil');
});
