import * as mm from 'mingru-models';
import post, { Post } from '../models/post.js';
import user, { User } from '../models/user.js';
import { testBuildAsync } from './common.js';

it('Table params', async () => {
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
  await testBuildAsync(ta, 'tableParams/from/user');
});

it('Table params with WRAP action', async () => {
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
  await testBuildAsync(commonTA, 'tableParams/wrap/common');
  await testBuildAsync(consumerTA, 'tableParams/wrap/consumer');
});

it('Table params with WRAP action inside transactions', async () => {
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
  await testBuildAsync(commonTA, 'tableParams/wrapTX/common');
  await testBuildAsync(consumerTA, 'tableParams/wrapTX/consumer');
});

it('Call a table action with a table param that has not been initialized', async () => {
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
  await testBuildAsync(postTA, 'tableParams/staticAG/post');
  await testBuildAsync(userUtilTA, 'tableParams/staticAG/userUtil');
});

it('Multiple table params in transactions', async () => {
  class UserParam extends User {}
  const userParam = mm.table(UserParam, { tableParam: true });
  class CommonAG extends mm.ActionGroup {
    insert = mm.insertOne().setParams();
    del = mm.deleteOne().by(userParam.id);
  }
  const commonTA = mm.actionGroup(userParam, CommonAG);

  class PostParam extends Post {}
  const postParam = mm.table(PostParam, { tableParam: true });

  class ConsumerAG extends mm.ActionGroup {
    tx = mm.transact(
      commonTA.insert.wrap({ userParam: user }),
      mm.insert().from(postParam).setDefaults().setParams(),
      commonTA.del,
    );

    wrapped = this.tx.wrap({ userParam: post });
  }
  const consumerTA = mm.actionGroup(post, ConsumerAG);
  await testBuildAsync(commonTA, 'tableParams/multipleTP/common');
  await testBuildAsync(consumerTA, 'tableParams/multipleTP/consumer');
});
