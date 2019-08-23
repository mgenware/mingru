import * as dd from 'dd-models';
import post from '../models/post';
import cols from '../models/cols';
import { testBuildAsync } from './common';

it('insert', async () => {
  class PostTA extends dd.TA {
    insertT = dd
      .insert()
      .setInputs(post.title, post.user_id)
      .setInputs();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/insert');
});

it('unsafeInsert', async () => {
  class PostTA extends dd.TA {
    insertT = dd.unsafeInsert().setInputs(post.title, post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/unsafeInsert');
});

it('insertOne', async () => {
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

it('unsafeInsertOne', async () => {
  class PostTA extends dd.TA {
    insertT = dd.unsafeInsertOne().setInputs(post.title, post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/unsafeInsertOne');
});

it('Insert with non-input setters', async () => {
  class PostTA extends dd.TA {
    insertT = dd
      .unsafeInsert()
      .setInputs(post.title, post.user_id)
      .set(post.content, dd.sql`"haha"`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/insertWithNonInputSetters');
});

it('insertWithDefaults', async () => {
  class ColsTA extends dd.TA {
    insertT = dd
      .insert()
      .setInputs(cols.fk)
      .setDefaults();
  }
  const ta = dd.ta(cols, ColsTA);
  await testBuildAsync(ta, 'insert/insertWithDefaults');
});

it('Custom DB name', async () => {
  class PostTA extends dd.TA {
    insertT = dd.unsafeInsert().setInputs(post.title, post.cmtCount);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'insert/customDBName');
});

it('Set auto-increment as input', async () => {
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
