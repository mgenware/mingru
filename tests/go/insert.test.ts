import * as mm from 'mingru-models';
import post from '../models/post.js';
import cols from '../models/cols.js';
import { testBuildAsync } from './common.js';
import user from '../models/user.js';

it('insert', async () => {
  class PostTA extends mm.TableActions {
    insertT = mm.insert().setInputs(post.title, post.user_id).setInputs();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'insert/insert');
});

it('unsafeInsert', async () => {
  class PostTA extends mm.TableActions {
    insertT = mm.unsafeInsert().setInputs(post.title, post.user_id);
  }
  const ta = mm.tableActions(post, PostTA);
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
  const employee = mm.table(Employee, 'employees');
  class EmployeeTA extends mm.TableActions {
    insertT = mm.insertOne().setInputs();
  }
  const ta = mm.tableActions(employee, EmployeeTA);
  await testBuildAsync(ta, 'insert/insertOne');
});

it('unsafeInsertOne', async () => {
  class PostTA extends mm.TableActions {
    insertT = mm.unsafeInsertOne().setInputs(post.title, post.user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'insert/unsafeInsertOne');
});

it('Insert with non-input setters', async () => {
  class PostTA extends mm.TableActions {
    insertT = mm
      .unsafeInsert()
      .setInputs(post.title, post.user_id)
      .set(post.content, mm.sql`"haha"`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'insert/insertWithNonInputSetters');
});

it('insertWithDefaults', async () => {
  class ColsTA extends mm.TableActions {
    insertT = mm.insert().setInputs(cols.fk).setDefaults();
  }
  const ta = mm.tableActions(cols, ColsTA);
  await testBuildAsync(ta, 'insert/insertWithDefaults');
});

it('Custom DB name', async () => {
  class PostTA extends mm.TableActions {
    insertT = mm.unsafeInsert().setInputs(post.title, post.cmtCount);
  }
  const ta = mm.tableActions(post, PostTA);
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
  const employee = mm.table(Employee, 'employees');
  class EmployeeTA extends mm.TableActions {
    insertT = mm.insertOne().setInputs(employee.id).setInputs();
  }
  const ta = mm.tableActions(employee, EmployeeTA);
  await testBuildAsync(ta, 'insert/aiColumnAsInput');
});

it('Nullable FK and `setDefaults`', async () => {
  class Post extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable.default(null);
  }
  const myPost = mm.table(Post);
  class PostTA extends mm.TableActions {
    insertT = mm.insertOne().setDefaults();
  }
  const ta = mm.tableActions(myPost, PostTA);
  await testBuildAsync(ta, 'insert/nullableFKSetDefaults');
});

it('Nullable FK and `setInputs`', async () => {
  class Post extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable.default(null);
  }
  const myPost = mm.table(Post);
  class PostTA extends mm.TableActions {
    insertT = mm.insertOne().setInputs();
  }
  const ta = mm.tableActions(myPost, PostTA);
  await testBuildAsync(ta, 'insert/nullableFKSetInputs');
});
