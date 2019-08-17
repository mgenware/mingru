import * as dd from 'dd-models';
import { testBuildAsync } from './common';
import user from '../models/user';
import post from '../models/post';

test('Common (NULL, defaults)', async () => {
  class User extends dd.Table {
    a = dd.varChar(100);
    b = dd.varChar(100).nullable;
    c = dd.varChar(100, 'haha');
    d = dd.uInt(432);
    e = dd.uBigInt();
  }
  const t = dd.table(User);
  await testBuildAsync(t, 'common/user');
});

test('PK', async () => {
  class User extends dd.Table {
    a = dd.pk();
    b = dd.uBigInt(12);
  }
  const t = dd.table(User);
  await testBuildAsync(t, 'pk/user');
});

test('Multiple PKs', async () => {
  class Post extends dd.Table {
    a = dd.pk();
    b = dd.pk(dd.char(4));
    user1 = dd.pk(user.id);
    user2 = dd.pk(user.id);
    d = dd.uBigInt(12);
  }
  const t = dd.table(Post);
  await testBuildAsync(t, 'multiplePKs/post');
});

test('FK', async () => {
  await testBuildAsync(user, 'fk/user');
  await testBuildAsync(post, 'fk/post');
});

test('noDefaultOnCSQL', async () => {
  class User extends dd.Table {
    a = dd.int(1);
    b = dd.int(1).noDefaultOnCSQL;
  }
  const t = dd.table(User);
  await testBuildAsync(t, 'noDefaultOnCSQL/user');
});

test('No SQL expr as default value', async () => {
  class User extends dd.Table {
    a = dd.int(1);
    b = dd.datetime(true);
    c = dd.datetime(false);
    d = dd.datetime().setDefault('2012-12-20');
  }
  const t = dd.table(User);
  await testBuildAsync(t, 'noSQLExpr/user');
});
