import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildToDirAsync } from './common';

test('Select', async () => {
  class PostTA extends dd.TA {
    selectTimes = dd.selectRows(post.datetime, post.date).orderByAsc(post.id);
    selectNullableTimes = dd
      .selectRows(post.n_datetime, post.n_date)
      .orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelect');
});

test('Select (where)', async () => {
  class PostTA extends dd.TA {
    selectTimes = dd
      .selectRows(post.datetime, post.date)
      .where(
        dd.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
          post.n_date
        } = ${post.n_date.toInput()}`,
      )
      .orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelectWhere');
});

test('Select field', async () => {
  class PostTA extends dd.TA {
    selectTime = dd.selectField(post.n_datetime);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelectField');
});

test('Update', async () => {
  class PostTA extends dd.TA {
    updateTimes = dd.unsafeUpdateAll().setInputs(post.datetime, post.date);
    updateNullableTimes = dd
      .unsafeUpdateAll()
      .setInputs(post.n_datetime, post.n_date);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsUpdate');
});

test('Update (where)', async () => {
  class PostTA extends dd.TA {
    updateTimes = dd
      .updateSome()
      .setInputs(post.datetime)
      .where(
        dd.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
          post.n_date
        } = ${post.n_date.toInput()}`,
      );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsUpdateWhere');
});

test('Delete (where)', async () => {
  class PostTA extends dd.TA {
    deleteTimes = dd
      .deleteOne()
      .where(
        dd.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
          post.n_date
        } = ${post.n_date.toInput()}`,
      );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsDeleteWhere');
});

test('Insert', async () => {
  class PostTA extends dd.TA {
    insertTimes = dd
      .unsafeInsertOne()
      .setInputs(post.datetime, post.n_datetime);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsInsert');
});
