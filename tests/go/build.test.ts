import * as mm from 'mingru-models';
import * as mr from '../../';
import user from '../models/user';
import post from '../models/post';
import postReply from '../models/postReply';
import { testBuildToDirAsync } from './common';

it('Single table', async () => {
  class PostTA extends mm.TableActions {
    selectPostTitle = mm.select(post.id, post.title);
    selectPostInfo = mm.select(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );
    updatePostTitle = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`${mm.input(post.title)}`);
    deleteByID = mm
      .deleteOne()
      .where(mm.sql`${post.id} = ${mm.input(post.id)}`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'singleTable');
});

it('Multiple tables', async () => {
  class UserTA extends mm.TableActions {
    selectProfile = mm.select(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setInputs(user.sig);
    deleteByID = mm.deleteOne().where(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectPostInfo = mm.select(
      post.id,
      post.content,
      post.user_id.join(user).url_name,
    );
    updateContent = mm
      .unsafeUpdateAll()
      .set(post.content, post.content.isEqualToInput());
    deleteByID = mm.deleteOne().where(post.id.isEqualToInput());
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['post', 'user'], 'multipleTables');
});

it('Custom package name', async () => {
  class PostTA extends mm.TableActions {
    selectPostTitle = mm.select(post.id, post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'customPackageName', {
    packageName: 'haha',
  });
});

it('Table DBName', async () => {
  class PostRplTA extends mm.TableActions {
    insertPostReply = mm
      .unsafeInsertOne()
      .setInputs(postReply.to_user_id, postReply.user_id);
  }
  const ta = mm.tableActions(postReply, PostRplTA);
  await testBuildToDirAsync([ta], ['post_reply'], 'tableName');
});

it('Multiple tables + CSQL', async () => {
  class UserTA extends mm.TableActions {
    selectProfile = mm.select(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setInputs(user.sig);
    deleteByID = mm.deleteOne().where(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectPostInfo = mm.select(
      post.id,
      post.content,
      post.user_id.join(user).url_name,
    );
    updateContent = mm
      .unsafeUpdateAll()
      .set(post.content, post.content.isEqualToInput());
    deleteByID = mm.deleteOne().where(post.id.isEqualToInput());
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(
    actions,
    ['post', 'user', 'post.sql', 'user.sql'],
    'multipleTablesCSQL',
    undefined,
    true,
  );
});

it('Types', async () => {
  class UserTA extends mm.TableActions {
    selectByID = mm
      .select(user.id)
      .byID()
      .attrs({ [mr.ActionAttributes.interfaceName]: 'Type1' });
    selectProfile = mm.select(user.display_name, user.sig);
    deleteByID = mm.deleteOne().where(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectByID = mm
      .select(post.id)
      .byID()
      .attrs({ [mr.ActionAttributes.interfaceName]: 'Type1' });
    selectPostInfo = mm
      .select(post.id, post.content, post.user_id.join(user).url_name)
      .attrs({ [mr.ActionAttributes.interfaceName]: 'Type2' });
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['#types.go'], 'types');
});
