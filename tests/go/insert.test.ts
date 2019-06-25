import * as dd from 'dd-models';
import post from '../models/post';
import cols from '../models/cols';
import { testBuildAsync } from './common';

test('insert', async () => {
  class PostTA extends dd.TA {
    insertT = dd
      .insert()
      .setInputs(post.title, post.user_id)
      .setInputs();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/insert');
});

test('unsafeInsert', async () => {
  class PostTA extends dd.TA {
    insertT = dd.unsafeInsert().setInputs(post.title, post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/unsafeInsert');
});

test('insertOne', async () => {
  class Employee extends dd.Table {
    id = dd.pk(dd.int()).setDBName('emp_no');
    firstName = dd.varChar(50);
    lastName = dd.varChar(50);
    gender = dd.varChar(10);
    birthDate = dd.date();
    hireDate = dd.date();
  }
  const employee = dd.table(Employee, 'employees');
  class EmployeeTA extends dd.TA {
    insertT = dd.insertOne().setInputs();
  }
  const ta = dd.ta(employee, EmployeeTA);
  await testBuildAsync(ta, 'insert/insertOne');
});

test('unsafeInsertOne', async () => {
  class PostTA extends dd.TA {
    insertT = dd.unsafeInsertOne().setInputs(post.title, post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/unsafeInsertOne');
});

test('Insert with non-input setters', async () => {
  class PostTA extends dd.TA {
    insertT = dd
      .unsafeInsert()
      .setInputs(post.title, post.user_id)
      .set(post.content, dd.sql`"haha"`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/insertWithNonInputSetters');
});

test('insertWithDefaults', async () => {
  class ColsTA extends dd.TA {
    insertT = dd
      .insert()
      .setInputs(cols.fk)
      .setDefaults();
  }
  const ta = dd.ta(cols, ColsTA);
  await testBuildAsync(ta, 'insert/insertWithDefaults');
});

test('Custom DB name', async () => {
  class PostTA extends dd.TA {
    insertT = dd.unsafeInsert().setInputs(post.title, post.cmtCount);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/customDBName');
});

test('Set auto-increment as input', async () => {
  class Employee extends dd.Table {
    id = dd.pk(dd.int()).setDBName('emp_no');
    firstName = dd.varChar(50);
    lastName = dd.varChar(50);
    gender = dd.varChar(10);
    birthDate = dd.date();
    hireDate = dd.date();
  }
  const employee = dd.table(Employee, 'employees');
  class EmployeeTA extends dd.TA {
    insertT = dd
      .insertOne()
      .setInputs(employee.id)
      .setInputs();
  }
  const ta = dd.ta(employee, EmployeeTA);
  await testBuildAsync(ta, 'insert/aiColumnAsInput');
});
