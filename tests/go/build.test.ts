import * as mm from 'mingru-models';
import { itRejects } from 'it-throws';
import user, { User } from '../models/user.js';
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

it('Multiple tables (dedup)', async () => {
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
  const actions = [userTA, postTA, postTA, user];
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

it('Multiple tables, CSQL', async () => {
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
  await testBuildToDirAsync(
    [userTA, postTA],
    ['post', 'user', 'post.sql', 'user.sql', migrationUpFile, migrationDownFile],
    'multipleTablesCSQL',
    { createTableSQL: true },
  );
});

it('Multiple tables, CSQL (dedup)', async () => {
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
  await testBuildToDirAsync(
    [userTA, postTA, user, userTA],
    ['post', 'user', 'post.sql', 'user.sql', migrationUpFile, migrationDownFile],
    'multipleTablesCSQL',
    { createTableSQL: true },
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
      .attr(mm.ActionAttribute.enableTSResultType, true);

    selectProfile = mm.selectRow(user.display_name, user.sig).resultTypeNameAttr('Res2');
    selectProfile2 = mm
      .selectRow(user.display_name, user.sig)
      .resultTypeNameAttr('Res3')
      .attr(mm.ActionAttribute.enableTSResultType, true);

    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToInput());
  }
  const userTA = mm.tableActions(user, UserTA);

  class PostTA extends mm.TableActions {
    selectByID = mm
      .selectRow(post.id)
      .by(post.id)
      .attr(mm.ActionAttribute.groupTypeName, 'Type1')
      .resultTypeNameAttr('Res1')
      .attr(mm.ActionAttribute.enableTSResultType, true);

    selectPostInfo = mm
      .selectRow(post.content, post.user_id.join(user).url_name)
      .attr(mm.ActionAttribute.groupTypeName, 'Type2')
      .attr(mm.ActionAttribute.enableTSResultType, true);

    selectTime = mm.selectRow(post.n_datetime).resultTypeNameAttr('Res3');
  }
  const postTA = mm.tableActions(post, PostTA);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['#types.go', 'post', 'user'], 'tsInterfaces', undefined, {
    testTSTypes: true,
  });
});

it('Multiple tables + Configurable table + virtual table', async () => {
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
  const postTA = mm.tableActions(post, PostTA, { configurableTableName: 'mrFromTable' });

  // Mirror of the user table.
  class VUser extends User {}
  const vUser = mm.table(VUser);

  class VUserTA extends mm.TableActions {
    selectProfile = mm.selectRow(vUser.display_name, vUser.sig);
    updateProfile = mm.unsafeUpdateAll().setInputs(vUser.sig);
    deleteByID = mm.deleteOne().whereSQL(vUser.id.isEqualToInput());
  }
  const vUserTA = mm.tableActions(vUser, VUserTA, { configurableTableName: 'mrFromTable' });

  const actions = [userTA, postTA, vUserTA];
  await testBuildToDirAsync(actions, ['post', 'user', 'v_user'], 'multipleTablesConfTable');
});

it('cleanOutDir = false', async () => {
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
  const testName = 'cleanOutDir';
  // First build.
  const builder = await testBuildToDirAsync([userTA], [], testName, undefined, { runOnly: true });
  // Second build.
  await testBuildToDirAsync([postTA], ['post', 'user'], testName, undefined, {
    outDir: builder.outDir,
  });
});

it('cleanOutDir = true', async () => {
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
  const testName = 'cleanOutDir';
  // First build.
  const builder = await testBuildToDirAsync([userTA], [], testName, undefined, { runOnly: true });
  // Second build.
  await testBuildToDirAsync(
    [postTA],
    ['post'],
    testName,
    { cleanOutDir: true },
    {
      outDir: builder.outDir,
    },
  );
  await itRejects(
    () =>
      testBuildToDirAsync(
        [postTA],
        ['user'],
        testName,
        { cleanOutDir: true },
        {
          outDir: builder.outDir,
        },
      ),
    /no such file or directory/,
  );
});

it('tables.go', async () => {
  class UserTA extends mm.TableActions {
    selectByID = mm
      .selectRow(user.id)
      .by(user.id)
      .attr(mm.ActionAttribute.groupTypeName, 'Type1')
      .resultTypeNameAttr('Res1');
  }
  const userTA = mm.tableActions(user, UserTA);
  const actions = [userTA, user, post, postReply];
  await testBuildToDirAsync(actions, ['#tables.go', 'user'], 'tablesGo');
});
