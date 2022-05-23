import * as mm from 'mingru-models';
import post from '../models/post.js';
import cols from '../models/cols.js';
import { testBuildAsync } from './common.js';
import user from '../models/user.js';

it('insert', async () => {
  class PostAG extends mm.ActionGroup {
    insertT = mm.insert().setParams(post.title, post.user_id).setParams();
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'insert/insert');
});

it('unsafeInsert', async () => {
  class PostAG extends mm.ActionGroup {
    insertT = mm.unsafeInsert().setParams(post.title, post.user_id);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'insert/unsafeInsert');
});

it('insertOne', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
    lastName = mm.varChar(50);
    gender = mm.varChar(10);
    birthDate = mm.date();
    hireDate = mm.date();
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    insertT = mm.insertOne().setParams();
  }
  const ta = mm.actionGroup(employee, EmployeeAG);
  await testBuildAsync(ta, 'insert/insertOne');
});

it('unsafeInsertOne', async () => {
  class PostAG extends mm.ActionGroup {
    insertT = mm.unsafeInsertOne().setParams(post.title, post.user_id);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'insert/unsafeInsertOne');
});

it('Insert with non-input setters', async () => {
  class PostAG extends mm.ActionGroup {
    insertT = mm
      .unsafeInsert()
      .setParams(post.title, post.user_id)
      .set(post.content, mm.sql`"haha"`);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'insert/insertWithNonInputSetters');
});

it('insertWithDefaults', async () => {
  class ColsAG extends mm.ActionGroup {
    insertT = mm.insert().setParams(cols.fk).setDefaults();
  }
  const ta = mm.actionGroup(cols, ColsAG);
  await testBuildAsync(ta, 'insert/insertWithDefaults');
});

it('Custom DB name', async () => {
  class PostAG extends mm.ActionGroup {
    insertT = mm.unsafeInsert().setParams(post.title, post.cmtCount);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'insert/customDBName');
});

it('Set auto-increment as input', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
    lastName = mm.varChar(50);
    gender = mm.varChar(10);
    birthDate = mm.date();
    hireDate = mm.date();
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    insertT = mm.insertOne().setParams(employee.id).setParams();
  }
  const ta = mm.actionGroup(employee, EmployeeAG);
  await testBuildAsync(ta, 'insert/aiColumnAsInput');
});

it('Nullable FK and `setDefaults`', async () => {
  class Post extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable.default(null);
  }
  const myPost = mm.table(Post);
  class PostAG extends mm.ActionGroup {
    insertT = mm.insertOne().setDefaults();
  }
  const ta = mm.actionGroup(myPost, PostAG);
  await testBuildAsync(ta, 'insert/nullableFKSetDefaults');
});

it('Nullable FK and `setInputs`', async () => {
  class Post extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable.default(null);
  }
  const myPost = mm.table(Post);
  class PostAG extends mm.ActionGroup {
    insertT = mm.insertOne().setParams();
  }
  const ta = mm.actionGroup(myPost, PostAG);
  await testBuildAsync(ta, 'insert/nullableFKSetInputs');
});

it('Reference values come last', async () => {
  class ColsAG extends mm.ActionGroup {
    insertT = mm.insert().set(cols.int, cols.fk).setParams(cols.fk).setDefaults();
  }
  const ta = mm.actionGroup(cols, ColsAG);
  await testBuildAsync(ta, 'insert/refValuesLast');
});
