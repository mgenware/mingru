import * as dd from 'dd-models';
import post from '../models/post';
import cols from '../models/cols';
import { testBuildAsync } from './common';

test('Insert', async () => {
  class PostTA extends dd.TA {
    insertT = dd.insert().setInputs(post.title, post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/insert');
});

test('InsertOne', async () => {
  class PostTA extends dd.TA {
    insertT = dd.insertOne().setInputs(post.title, post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/insertOne');
});

test('Insert with non-input setters', async () => {
  class PostTA extends dd.TA {
    insertT = dd
      .insert()
      .setInputs(post.title, post.user_id)
      .set(post.content, dd.sql`"haha"`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/insertWithNonInputSetters');
});

test('insertWithDefaults', async () => {
  class ColsTA extends dd.TA {
    insertT = dd.insertWithDefaults().setInputs(cols.fk);
  }
  const ta = dd.ta(cols, ColsTA);
  await testBuildAsync(ta, 'insert/insertWithDefaults');
});

test('Custom DB name', async () => {
  class PostTA extends dd.TA {
    insertT = dd.insert().setInputs(post.title, post.cmtCount);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/customDBName');
});
