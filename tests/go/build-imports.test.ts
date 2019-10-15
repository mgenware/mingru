import * as mm from 'mingru-models';
import post from '../models/post';
import { testBuildToDirAsync } from './common';

it('Select', async () => {
  class PostTA extends mm.TableActions {
    selectTimes = mm.selectRows(post.datetime, post.date).orderByAsc(post.id);
    selectNullableTimes = mm
      .selectRows(post.n_datetime, post.n_date)
      .orderByAsc(post.id);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelect');
});

it('Select (where)', async () => {
  class PostTA extends mm.TableActions {
    selectTimes = mm
      .selectRows(post.datetime, post.date)
      .where(
        mm.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
          post.n_date
        } = ${post.n_date.toInput()}`,
      )
      .orderByAsc(post.id);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelectWhere');
});

it('Select field', async () => {
  class PostTA extends mm.TableActions {
    selectTime = mm.selectField(post.n_datetime);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelectField');
});

it('Update', async () => {
  class PostTA extends mm.TableActions {
    updateTimes = mm.unsafeUpdateAll().setInputs(post.datetime, post.date);
    updateNullableTimes = mm
      .unsafeUpdateAll()
      .setInputs(post.n_datetime, post.n_date);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsUpdate');
});

it('Update (where)', async () => {
  class PostTA extends mm.TableActions {
    updateTimes = mm
      .updateSome()
      .setInputs(post.datetime)
      .where(
        mm.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
          post.n_date
        } = ${post.n_date.toInput()}`,
      );
  }
  const ta = mm.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsUpdateWhere');
});

it('Delete (where)', async () => {
  class PostTA extends mm.TableActions {
    deleteTimes = mm
      .deleteOne()
      .where(
        mm.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
          post.n_date
        } = ${post.n_date.toInput()}`,
      );
  }
  const ta = mm.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsDeleteWhere');
});

it('Insert', async () => {
  class PostTA extends mm.TableActions {
    insertTimes = mm
      .unsafeInsertOne()
      .setInputs(post.datetime, post.n_datetime);
  }
  const ta = mm.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsInsert');
});
