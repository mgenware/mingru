import * as mm from 'mingru-models';
import { itRejects } from 'it-throws';
import user, { User } from '../models/user.js';
import post, { Post } from '../models/post.js';
import postReply from '../models/postReply.js';
import { testBuildToDirAsync, migrationUpFile, migrationDownFile } from './common.js';

it('Single table', async () => {
  class PostAG extends mm.ActionGroup {
    selectPostTitle = mm.selectRow(post.id, post.title);
    selectPostInfo = mm.selectRow(
      post.id,
      post.title,
      post.user_id,
      post.user_id.join(user).url_name,
    );

    updatePostTitle = mm.unsafeUpdateAll().set(post.title, mm.sql`${mm.param(post.title)}`);
    deleteByID = mm.deleteOne().whereSQL(mm.sql`${post.id} = ${mm.param(post.id)}`);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post', '#tables.go'], 'singleTable');
});

it('Multiple tables', async () => {
  class UserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToParam());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToParam());
  }
  const postTA = mm.actionGroup(post, PostAG);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['post', 'user', '#tables.go'], 'multipleTables');
});

it('Multiple tables (dedup)', async () => {
  class UserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToParam());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToParam());
  }
  const postTA = mm.actionGroup(post, PostAG);
  const actions = [userTA, postTA, postTA, user];
  await testBuildToDirAsync(actions, ['post', 'user', '#tables.go'], 'multipleTables');
});

it('Custom package name', async () => {
  class PostAG extends mm.ActionGroup {
    selectPostTitle = mm.selectRow(post.id, post.title);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildToDirAsync([ta], ['post', '#tables.go'], 'customPackageName', {
    packageName: 'haha',
  });
});

it('Table DBName', async () => {
  class PostRplAG extends mm.ActionGroup {
    insertPostReply = mm.unsafeInsertOne().setParams(postReply.to_user_id, postReply.user_id);
  }
  const ta = mm.actionGroup(postReply, PostRplAG);
  await testBuildToDirAsync([ta], ['post_rpl', '#tables.go'], 'tableName');
});

it('Multiple tables, CSQL', async () => {
  class UserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToParam());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToParam());
  }
  const postTA = mm.actionGroup(post, PostAG);

  class ExtraTable extends mm.Table {
    id = mm.pk();
  }
  const et = mm.table(ExtraTable, { dbName: 'et' });

  await testBuildToDirAsync(
    [userTA, postTA, et],
    [
      'post',
      'user',
      'post.sql',
      'user.sql',
      '#tables.go',
      'extra_table.sql',
      migrationUpFile,
      migrationDownFile,
    ],
    'multipleTablesCSQL',
    { createTableSQL: true },
  );
});

it('Multiple tables, CSQL (dedup)', async () => {
  class UserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToParam());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToParam());
  }
  const postTA = mm.actionGroup(post, PostAG);

  class ExtraTable extends mm.Table {
    id = mm.pk();
  }
  const et = mm.table(ExtraTable, { dbName: 'et' });

  await testBuildToDirAsync(
    [userTA, postTA, user, userTA, et],
    [
      'post',
      'user',
      'post.sql',
      'user.sql',
      '#tables.go',
      'extra_table.sql',
      migrationUpFile,
      migrationDownFile,
    ],
    'multipleTablesCSQL',
    { createTableSQL: true },
  );
});

it('CSQL and table param', async () => {
  class VT extends mm.Table {}
  const vt = mm.table(VT, { tableParam: true });
  await itRejects(
    () =>
      testBuildToDirAsync([vt], ['vt.sql'], 'csqlVirtualTable', {
        createTableSQL: true,
      }),
    /ENOENT: no such file or directory/,
  );
});

it('Types', async () => {
  class UserAG extends mm.ActionGroup {
    selectByID = mm
      .selectRow(user.id)
      .by(user.id)
      .attr(mm.ActionAttribute.groupTypeName, 'Type1')
      .resultTypeNameAttr('Res1');

    selectProfile = mm.selectRow(user.display_name, user.sig).resultTypeNameAttr('Res2');

    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
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
  const postTA = mm.actionGroup(post, PostAG);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['#types.go', 'post', 'user'], 'types');
});

it('Result type merging', async () => {
  class UserAG extends mm.ActionGroup {
    t1 = mm.selectRow(user.id, user.age).by(user.id).resultTypeNameAttr('Res');
    t2 = mm
      .selectRow(user.display_name, user.age, user.follower_count)
      .by(user.id)
      .resultTypeNameAttr('Res');
  }
  const userTA = mm.actionGroup(user, UserAG);
  const actions = [userTA];
  await testBuildToDirAsync(actions, ['#types.go', 'user'], 'resultTypeMerging');
});

it('TS interfaces', async () => {
  class UserAG extends mm.ActionGroup {
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

    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
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
  const postTA = mm.actionGroup(post, PostAG);
  const actions = [userTA, postTA];
  await testBuildToDirAsync(actions, ['#types.go', 'post', 'user'], 'tsInterfaces', undefined, {
    testTSTypes: true,
  });
});

it('Multiple tables + Table params', async () => {
  class UserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userAG = mm.actionGroup(user, UserAG);

  class PostTP extends Post {}
  const postTP = mm.table(PostTP, { tableParam: true });
  class PostAG extends mm.ActionGroup {
    selectPostInfo = mm.selectRow(postTP.id, postTP.content, postTP.user_id.join(user).url_name);
    updateContent = mm.unsafeUpdateAll().set(postTP.content, postTP.content.isEqualToParam());
    deleteByID = mm.deleteOne().whereSQL(postTP.id.isEqualToParam());
  }
  const postAG = mm.actionGroup(postTP, PostAG);

  class UserTP extends User {}
  const userTP = mm.table(UserTP, { tableParam: true });

  class VUserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(userTP.display_name, userTP.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(userTP.sig);
    deleteByID = mm.deleteOne().whereSQL(userTP.id.isEqualToParam());
  }
  const vUserAG = mm.actionGroup(userTP, VUserAG);

  const actions = [userAG, postAG, vUserAG];
  await testBuildToDirAsync(actions, ['post', 'user', 'v_user'], 'multipleTablesConfTable');
});

it('cleanOutDir = false', async () => {
  class UserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToParam());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToParam());
  }
  const postTA = mm.actionGroup(post, PostAG);
  const testName = 'cleanOutDir';
  // First build.
  const builder = await testBuildToDirAsync([userTA], [], testName, undefined, { runOnly: true });
  // Second build.
  await testBuildToDirAsync([postTA], ['post', 'user'], testName, undefined, {
    outDir: builder.outDir,
  });
});

it('cleanOutDir = true', async () => {
  class UserAG extends mm.ActionGroup {
    selectProfile = mm.selectRow(user.display_name, user.sig);
    updateProfile = mm.unsafeUpdateAll().setParams(user.sig);
    deleteByID = mm.deleteOne().whereSQL(user.id.isEqualToParam());
  }
  const userTA = mm.actionGroup(user, UserAG);

  class PostAG extends mm.ActionGroup {
    selectPostInfo = mm.selectRow(post.id, post.content, post.user_id.join(user).url_name);

    updateContent = mm.unsafeUpdateAll().set(post.content, post.content.isEqualToParam());

    deleteByID = mm.deleteOne().whereSQL(post.id.isEqualToParam());
  }
  const postTA = mm.actionGroup(post, PostAG);
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

it('Single configurable table', async () => {
  class ConfTable extends Post {}
  const t = mm.table(ConfTable, { tableParam: true });
  class PostAG extends mm.ActionGroup {
    selectPostTitle = mm.selectRow(t.id, t.title);
    selectPostInfo = mm.selectRow(t.id, t.title, t.user_id, t.user_id.join(user).url_name);

    updatePostTitle = mm.unsafeUpdateAll().set(t.title, mm.sql`${mm.param(t.title)}`);
    deleteByID = mm.deleteOne().whereSQL(mm.sql`${t.id} = ${mm.param(t.id)}`);
  }
  const ta = mm.actionGroup(t, PostAG);
  await testBuildToDirAsync([ta], ['post', '#tables.go'], 'singleVirtualTable');
});
