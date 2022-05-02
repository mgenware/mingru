import * as mm from 'mingru-models';
import post from '../models/post.js';
import user, { User } from '../models/user.js';
import { testBuildAsync } from './common.js';

it('configurableTable', async () => {
  class ConfTable extends User {}
  const t = mm.table(ConfTable, { tableParam: true });
  class UserAG extends mm.ActionGroup {
    selectT = mm.selectRow(t.id, t.age);
    insertT = mm.insertOne().setParams();
    updateT = mm.updateOne().setParams().by(t.id);
    deleteT = mm.deleteOne().by(t.id);
    transactT = mm.transact(this.insertT, mm.insertOne().from(post).setParams());
  }
  const ta = mm.actionGroup(t, UserAG);
  await testBuildAsync(ta, 'configurable-table/from/user');
});

it('configurableTable with WRAP action', async () => {
  // Two tables with the almost same structure.
  class MRFromTable extends User {}
  const t = mm.table(MRFromTable, { tableParam: true });
  class CommonAG extends mm.ActionGroup {
    insert = mm.insertOne().setParams();
    del = mm.deleteOne().by(t.id);
    upd = mm.updateOne().setParams().by(t.id);
    sel = mm.selectRows(t.display_name).by(t.id).orderByAsc(t.display_name);
  }
  const commonTA = mm.actionGroup(t, CommonAG);

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
  class MRFromTable extends User {}
  const t = mm.table(MRFromTable, { tableParam: true });
  class CommonAG extends mm.ActionGroup {
    insert = mm.insertOne().setParams();
    del = mm.deleteOne().by(t.id);
    upd = mm.updateOne().setParams().by(t.id);
    sel = mm.selectRows(t.display_name).by(t.id).orderByAsc(t.display_name);
  }
  const commonTA = mm.actionGroup(t, CommonAG);

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
  class UserTP extends User {
    id = mm.pk();
  }
  const userTP = mm.table(UserTP, { tableParam: true });

  class UserUtilAG extends mm.ActionGroup {
    t = mm.updateOne().setParams().by(userTP.id);
  }
  const userUtilTA = mm.actionGroup(userTP, UserUtilAG);

  class PostAG extends mm.ActionGroup {
    t = userUtilTA.t.wrap({ userTp: post });
  }
  const postTA = mm.actionGroup(post, PostAG);
  // Build post TA first.
  await testBuildAsync(postTA, 'configurable-table/static-ta/post');
  await testBuildAsync(userUtilTA, 'configurable-table/static-ta/userUtil');
});
