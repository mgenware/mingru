import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import postReply from '../models/postReply';
import { testBuildToDirAsync } from './common';

test('Single table', async () => {
  class PostTA extends dd.TA {
    selectPostTitle = dd.select(post.id, post.title);
    selectPostInfo = dd.select(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );
    updatePostTitle = dd
      .unsafeUpdateAll()
      .set(post.title, dd.sql`${dd.input(post.title)}`);
    deleteByID = dd
      .deleteOne()
      .where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'singleTable');
});

test('Multiple tables', async () => {
  class UserTA extends dd.TA {
    selectProfile = dd.select(user.display_name, user.sig);
    updateProfile = dd.unsafeUpdateAll().setInputs(user.sig);
    deleteByID = dd.deleteOne().where(user.id.isEqualToInput());
  }
  const userTA = dd.ta(user, UserTA);

  class PostTA extends dd.TA {
    selectPostInfo = dd.select(
      post.id,
      post.content,
      post.user_id.join(user).url_name,
    );
    updateContent = dd
      .unsafeUpdateAll()
      .set(post.content, post.content.isEqualToInput());
    deleteByID = dd.deleteOne().where(post.id.isEqualToInput());
  }
  const postTA = dd.ta(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['post', 'user'], 'multipleTables');
});

test('Custom package name', async () => {
  class PostTA extends dd.TA {
    selectPostTitle = dd.select(post.id, post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'customPackageName', {
    packageName: 'haha',
  });
});

test('Table DBName', async () => {
  class PostRplTA extends dd.TA {
    insertPostReply = dd
      .unsafeInsertOne()
      .setInputs(postReply.to_user_id, postReply.user_id);
  }
  const ta = dd.ta(postReply, PostRplTA);
  await testBuildToDirAsync([ta], ['post_reply'], 'tableName');
});

test('Multiple tables + CSQL', async () => {
  class UserTA extends dd.TA {
    selectProfile = dd.select(user.display_name, user.sig);
    updateProfile = dd.unsafeUpdateAll().setInputs(user.sig);
    deleteByID = dd.deleteOne().where(user.id.isEqualToInput());
  }
  const userTA = dd.ta(user, UserTA);

  class PostTA extends dd.TA {
    selectPostInfo = dd.select(
      post.id,
      post.content,
      post.user_id.join(user).url_name,
    );
    updateContent = dd
      .unsafeUpdateAll()
      .set(post.content, post.content.isEqualToInput());
    deleteByID = dd.deleteOne().where(post.id.isEqualToInput());
  }
  const postTA = dd.ta(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(
    actions,
    ['post', 'user', 'post.sql', 'user.sql'],
    'multipleTablesCSQL',
    { buildCSQL: true },
  );
});
