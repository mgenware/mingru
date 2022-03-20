import * as mm from 'mingru-models';
import post from '../models/post.js';
import { testBuildToDirAsync } from './common.js';

it('Select', async () => {
  class PostAG extends mm.ActionGroup {
    selectTimes = mm.selectRows(post.datetime, post.date).orderByAsc(post.id);
    selectNullableTimes = mm.selectRows(post.n_datetime, post.n_date).orderByAsc(post.id);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelect');
});

it('Select (where)', async () => {
  class PostAG extends mm.ActionGroup {
    selectTimes = mm
      .selectRows(post.datetime, post.date)
      .whereSQL(
        mm.sql`${post.n_datetime} = ${post.n_datetime.toParam()} OR ${
          post.n_date
        } = ${post.n_date.toParam()}`,
      )
      .orderByAsc(post.id);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelectWhere');
});

it('Select field', async () => {
  class PostAG extends mm.ActionGroup {
    selectTime = mm.selectField(post.n_datetime);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelectField');
});

it('Update', async () => {
  class PostAG extends mm.ActionGroup {
    updateTimes = mm.unsafeUpdateAll().setParams(post.datetime, post.date);
    updateNullableTimes = mm.unsafeUpdateAll().setParams(post.n_datetime, post.n_date);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsUpdate');
});

it('Update (where)', async () => {
  class PostAG extends mm.ActionGroup {
    updateTimes = mm
      .updateSome()
      .setParams(post.datetime)
      .whereSQL(
        mm.sql`${post.n_datetime} = ${post.n_datetime.toParam()} OR ${
          post.n_date
        } = ${post.n_date.toParam()}`,
      );
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsUpdateWhere');
});

it('Delete (where)', async () => {
  class PostAG extends mm.ActionGroup {
    deleteTimes = mm
      .deleteOne()
      .whereSQL(
        mm.sql`${post.n_datetime} = ${post.n_datetime.toParam()} OR ${
          post.n_date
        } = ${post.n_date.toParam()}`,
      );
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsDeleteWhere');
});

it('Insert', async () => {
  class PostAG extends mm.ActionGroup {
    insertTimes = mm.unsafeInsertOne().setParams(post.datetime, post.n_datetime);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsInsert');
});
