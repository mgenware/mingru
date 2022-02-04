import * as mm from 'mingru-models';
import * as mr from '../../dist/main.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { testBuildAsync } from './common.js';

it('configurableTable', async () => {
  class UserTA extends mm.TableActions {
    selectT = mm.selectRow(user.id, user.age);
    insertT = mm.insertOne().setInputs();
    updateT = mm.updateOne().setInputs().by(user.id);
    deleteT = mm.deleteOne().by(user.id);
    transactT = mm.transact(this.insertT, mm.insertOne().from(post).setInputs());
  }
  const ta = mm.tableActions(user, UserTA, { configurableTable: true });
  await testBuildAsync(ta, 'configurable-table/from/user');
});

it('configurableTable with WRAP action', async () => {
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
  const commonTA = mm.tableActions(userT, CommonTA, { configurableTable: true });

  class ConsumerTA extends mm.TableActions {
    addUser = commonTA.insert.wrap({ [mr.fromTableParamName]: userT });
    addPost = commonTA.insert.wrap({ [mr.fromTableParamName]: postT });
  }
  const consumerTA = mm.tableActions(post, ConsumerTA);
  await testBuildAsync(commonTA, 'configurable-table/wrap/common');
  await testBuildAsync(consumerTA, 'configurable-table/wrap/consumer');
});
