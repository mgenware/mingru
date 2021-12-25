import * as mm from 'mingru-models';
import user from '../models/user.js';
import post from '../models/post.js';
import postReply from '../models/postReply.js';
import { testBuildToDirAsync, migrationUpFile, migrationDownFile } from './common.js';

it('Single table', async () => {
  class PostTA extends mm.TableActions {
    selectPostTitle = mm.selectRow(post.id, post.title);
    selectPostInfo = mm.selectRow(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );

    updatePostTitle = mm.unsafeUpdateAll().set(post.title, mm.sql`${mm.input(post.title)}`);

    deleteByID = mm.deleteOne().whereSQL(mm.sql`${post.id} = ${mm.input(post.id)}`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'singleTable');
});

it('Multiple tables', async () => {
  class UserTA extends mm.TableActions {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setInputs(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToInput());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToInput());
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['post', 'user'], 'multipleTables');
});

it('Custom package name', async () => {
  class PostTA extends mm.TableActions {
    selectPostTitle = mm.selectRow(post.id, post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildToDirAsync([ta], ['post'], 'customPackageName', {
    packageName: 'haha',
  });
});

it('Table DBName', async () => {
  class PostRplTA extends mm.TableActions {
    insertPostReply = mm.unsafeInsertOne().setInputs(postReply.to_user_id, postReply.user_id);
  }
  const ta = mm.tableActions(postReply, PostRplTA);
  await testBuildToDirAsync([ta], ['post_reply'], 'tableName');
});

it('Multiple tables + CSQL', async () => {
  class UserTA extends mm.TableActions {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setInputs(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToInput());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToInput());
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(
    actions,
    ['post', 'user', 'post.sql', 'user.sql', migrationUpFile, migrationDownFile],
    'multipleTablesCSQL',
    undefined,
    true,
  );
});

it('Types', async () => {
  class UserTA extends mm.TableActions {
    selectByID = mm
      .selectRow(user.id)
      .by(user.id)
      .attr(mm.ActionAttribute.groupTypeName, 'Type1')
      .resultTypeNameAttr('Res1');

    selectProfile = mm.selectRow(user.display_name, user.sig).resultTypeNameAttr('Res2');

    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectByID = mm
      .selectRow(post.id)
      .by(post.id)
      .attr(mm.ActionAttribute.groupTypeName, 'Type1')
      .resultTypeNameAttr('Res1');

    selectPostInfo = mm
      .selectRow(post.n_datetime, post.user_id.join(user).url_name)
      .attr(mm.ActionAttribute.groupTypeName, 'Type2');

    selectTime = mm.selectRow(post.n_datetime).resultTypeNameAttr('Res3');
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['#types.go', 'post', 'user'], 'types');
});

it('Result type merging', async () => {
  class UserTA extends mm.TableActions {
    t1 = mm.selectRow(user.id, user.age).by(user.id).resultTypeNameAttr('Res');
    t2 = mm
      .selectRow(user.display_name, user.age, user.follower_count)
      .by(user.id)
      .resultTypeNameAttr('Res');
  }
  const userTA = mm.tableActions(user, UserTA);
  const actions = [userTA];
  await testBuildToDirAsync(actions, ['#types.go', 'user'], 'resultTypeMerging');
});

it('TS interfaces', async () => {
  class UserTA extends mm.TableActions {
    selectByID = mm
      .selectRow(user.id)
      .by(user.id)
      .attr(mm.ActionAttribute.groupTypeName, 'Type1')
      .resultTypeNameAttr('Res1')
      .attr(mm.ActionAttribute.tsTypeName, 'FooInterface');

    selectProfile = mm.selectRow(user.display_name, user.sig).resultTypeNameAttr('Res2');
    selectProfile2 = mm
      .selectRow(user.display_name, user.sig)
      .resultTypeNameAttr('Res3')
      .attr(mm.ActionAttribute.tsTypeName, 'FooInterface2');

    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectByID = mm
      .selectRow(post.id)
      .by(post.id)
      .attr(mm.ActionAttribute.groupTypeName, 'Type1')
      .resultTypeNameAttr('Res1')
      .attr(mm.ActionAttribute.tsTypeName, 'BarInterface');

    selectPostInfo = mm
      .selectRow(post.n_datetime, post.user_id.join(user).url_name)
      .attr(mm.ActionAttribute.groupTypeName, 'Type2')
      .attr(mm.ActionAttribute.tsTypeName, 'BarInterface2');

    selectTime = mm.selectRow(post.n_datetime).resultTypeNameAttr('Res3');
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['#types.go', 'post', 'user'], 'types');
});
