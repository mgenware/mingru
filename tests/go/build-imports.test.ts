import * as dd from 'mingru-models';
import post from '../models/post';
import { testBuildToDirAsync } from './common';

it('Select', async () => {
  class PostTA extends dd.TA {
    selectTimes = dd.selectRows(post.datetime, post.date).orderByAsc(post.id);
    selectNullableTimes = dd
      .selectRows(post.n_datetime, post.n_date)
      .orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelect');
});

it('Select (where)', async () => {
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

it('Select field', async () => {
  class PostTA extends dd.TA {
    selectTime = dd.selectField(post.n_datetime);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsSelectField');
});

it('Update', async () => {
  class PostTA extends dd.TA {
    updateTimes = dd.unsafeUpdateAll().setInputs(post.datetime, post.date);
    updateNullableTimes = dd
      .unsafeUpdateAll()
      .setInputs(post.n_datetime, post.n_date);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsUpdate');
});

it('Update (where)', async () => {
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

it('Delete (where)', async () => {
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

it('Insert', async () => {
  class PostTA extends dd.TA {
    insertTimes = dd
      .unsafeInsertOne()
      .setInputs(post.datetime, post.n_datetime);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'extraImportsInsert');
});
