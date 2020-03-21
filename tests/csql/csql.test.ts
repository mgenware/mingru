import * as mm from 'mingru-models';
import { testBuildAsync } from './common';
import user from '../models/user';
import post from '../models/post';
import like from '../models/like';

it('Common (NULL, defaults)', async () => {
  class User extends mm.Table {
    a = mm.varChar(100);
    b = mm.varChar(100).nullable;
    c = mm.varChar(100).default('haha');
    d = mm.uInt().default(432);
    e = mm.uBigInt();
  }
  const t = mm.table(User);
  await testBuildAsync(t, 'common/user');
});

it('PK', async () => {
  class User extends mm.Table {
    a = mm.pk();
    b = mm.uBigInt().default(12);
  }
  const t = mm.table(User);
  await testBuildAsync(t, 'pk/user');
});

it('Multiple PKs', async () => {
  class Post extends mm.Table {
    a = mm.pk();
    b = mm.pk(mm.char(4));
    user1 = mm.pk(user.id);
    user2 = mm.pk(user.id);
    d = mm.uBigInt().default(12);
  }
  const t = mm.table(Post, 'db_post');
  await testBuildAsync(t, 'multiplePKs/post');
});

it('FK', async () => {
  await testBuildAsync(user, 'fk/user');
  await testBuildAsync(post, 'fk/post');
});

it('noDefaultOnCSQL', async () => {
  class User extends mm.Table {
    a = mm.int().default(1);
    b = mm.int().default(1).noDefaultOnCSQL;
  }
  const t = mm.table(User);
  await testBuildAsync(t, 'noDefaultOnCSQL/user');
});

it('No SQL expr as default value', async () => {
  class User extends mm.Table {
    a = mm.int().default(1);
    b = mm.datetime('local');
    c = mm.datetime();
    d = mm.datetime().default('2012-12-20');
  }
  const t = mm.table(User);
  await testBuildAsync(t, 'noSQLExpr/user');
});

it('Composite PKs', async () => {
  await testBuildAsync(like, 'compositePKs/like');
});

it('UNIQUE', async () => {
  class User extends mm.Table {
    a = mm.pk();
    b = mm.uBigInt().unique;
  }
  const t = mm.table(User);
  await testBuildAsync(t, 'unique/user');
});

it('Numeric length', async () => {
  class User extends mm.Table {
    a = mm.int(10);
    b = mm.uInt(10).default(2);
    c = mm.float(5);
  }
  const t = mm.table(User);
  await testBuildAsync(t, 'numericLength/user');
});
