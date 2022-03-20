import * as mm from 'mingru-models';
import { testBuildAsync } from './common.js';
import cmt2 from '../models/cmt2.js';
import postCmt from '../models/postCmt.js';
import post from '../models/post.js';

it('Declare return types', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    insert = mm.insertOne().setParams();
    insert2 = mm
      .transact(
        this.insert,
        this.insert.declareReturnValues({
          [mm.ReturnValues.insertedID]: 'id2',
        }),
      )
      .setReturnValues('id2');
  }
  const employeeTA = mm.actionGroup(employee, EmployeeAG);
  await testBuildAsync(employeeTA, 'tx/declareRetFromInsert/employee');
});

it('Pass values in child actions (no return value declaration)', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    getFirstName = mm.selectField(employee.firstName).by(employee.id);
    insert = mm.insertOne().setParams();
    insert1 = mm.transact(
      this.getFirstName.declareReturnValue(mm.ReturnValues.result, 'firstName'),
      mm
        .insertOne()
        .setParams()
        .wrap({ firstName: mm.captureVar('firstName') }),
    );
  }
  const employeeTA = mm.actionGroup(employee, EmployeeAG);
  await testBuildAsync(employeeTA, 'tx/passValues/employee');
});

it('Pass values in child actions and declare return values', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    getFirstName = mm.selectField(employee.firstName).by(employee.id);
    insert = mm
      .transact(
        this.getFirstName.declareReturnValue(mm.ReturnValues.result, 'firstName'),
        mm
          .insertOne()
          .setParams()
          .wrap({ firstName: mm.captureVar('firstName') })
          .declareReturnValues({
            [mm.ReturnValues.insertedID]: 'id2',
          }),
      )
      .setReturnValues('firstName', 'id2');
  }
  const employeeTA = mm.actionGroup(employee, EmployeeAG);
  await testBuildAsync(employeeTA, 'tx/passValuesAndDecRet/employee');
});

it('Return multiple values', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).setDBName('emp_no').autoIncrement;
    firstName = mm.varChar(50);
    lastName = mm.varChar(50);
    gender = mm.varChar(10);
    birthDate = mm.date();
    hireDate = mm.date();
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    insertEmp = mm.insertOne().setParams();
  }
  const employeeTA = mm.actionGroup(employee, EmployeeAG);
  class Dept extends mm.Table {
    no = mm.pk().setDBName('dept_no');
    name = mm.varChar(40).setDBName('dept_name');
  }

  const dept = mm.table(Dept, { dbName: 'departments' });
  class DeptAG extends mm.ActionGroup {
    insertDept = mm.insertOne().setParams();
  }
  const deptTA = mm.actionGroup(dept, DeptAG);
  class DeptManager extends mm.Table {
    empNo = employee.id;
    deptNo = dept.no;
    fromDate = mm.date();
    toDate = mm.date();
  }
  const deptManager = mm.table(DeptManager, { dbName: 'dept_manager' });
  const empNo = 'empNo';
  const deptNo = 'deptNo';
  class DeptManagerAG extends mm.ActionGroup {
    insertCore = mm.insertOne().setParams();
    insert = mm
      .transact(
        employeeTA.insertEmp.declareReturnValue(mm.ReturnValues.insertedID, empNo),
        deptTA.insertDept.declareReturnValue(mm.ReturnValues.insertedID, deptNo),
        this.insertCore.wrapAsRefs({
          empNo,
          deptNo,
        }),
      )
      .setReturnValues(deptNo, empNo);
  }

  const deptManagerTA = mm.actionGroup(deptManager, DeptManagerAG);
  await testBuildAsync(employeeTA, 'tx/multipleRetValues/employee');
  await testBuildAsync(deptTA, 'tx/multipleRetValues/dept');
  await testBuildAsync(deptManagerTA, 'tx/multipleRetValues/deptManager');
});

it('Inline member actions', async () => {
  class User extends mm.Table {
    id = mm.pk();
    postCount = mm.int();
  }
  const user = mm.table(User);
  class UserAG extends mm.ActionGroup {
    updatePostCount = mm
      .updateOne()
      .set(user.postCount, mm.sql`${user.postCount} + ${mm.param(mm.int(), 'offset')}`)
      .by(user.id);
  }
  const userTA = mm.actionGroup(user, UserAG);
  class Post extends mm.Table {
    id = mm.pk();
    title = mm.varChar(200);
  }

  const post2 = mm.table(Post, { dbName: 'db_post' });
  class PostAG extends mm.ActionGroup {
    insertCore = mm.insertOne().setParams();
    insert = mm.transact(
      userTA.updatePostCount.wrap({ offset: '1' }),
      this.insertCore,
      mm.updateOne().setParams().by(post2.id),
      mm.updateOne().setParams().by(post2.id).wrap({ title: '"TITLE"' }),
      this.insertCore.wrap({ title: '"abc"' }),
    );
  }
  const postTA = mm.actionGroup(post2, PostAG);
  await testBuildAsync(userTA, 'tx/tmpActions/user');
  await testBuildAsync(postTA, 'tx/tmpActions/post');
});

it('Inline member actions (with from)', async () => {
  class PostAG extends mm.ActionGroup {
    t = mm.transact(
      mm.insertOne().from(cmt2).setParams(),
      mm.insertOne().from(postCmt).setParams(),
    );
  }
  const postTA = mm.actionGroup(post, PostAG);
  await testBuildAsync(postTA, 'tx/tmpActionsWithFrom/post');
});

it('Reference property values', async () => {
  class User extends mm.Table {
    id = mm.pk();
    age = mm.int();
    score = mm.int();
    name = mm.varChar(200);
  }
  const user = mm.table(User);
  class UserAG extends mm.ActionGroup {
    t = mm.transact(
      mm.selectRow(user.age, user.name).declareReturnValue(mm.ReturnValues.result, 'res'),
      mm
        .insertOne()
        .setParams()
        .wrap({
          age: mm.captureVar('res.Age'),
          name: '"FOO"',
        }),
    );
  }
  const userTA = mm.actionGroup(user, UserAG);
  await testBuildAsync(userTA, 'tx/refPropertyValues/user');
});

it('Use the return value of a TX', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    insert = mm.insertOne().setParams();
    insert2 = mm
      .transact(
        this.insert,
        this.insert.declareReturnValues({
          [mm.ReturnValues.insertedID]: 'id2',
        }),
      )
      .setReturnValues('id2');

    // Use the return value in another TX;
    insert3 = mm
      .transact(this.insert, this.insert2.declareReturnValue('id2', 'id3'))
      .setReturnValues('id3');
  }
  const employeeTA = mm.actionGroup(employee, EmployeeAG);
  await testBuildAsync(employeeTA, 'tx/useTXReturnValue/employee');
});

it('Call an inner TX with .wrap', async () => {
  class PostAG extends mm.ActionGroup {
    t = mm.transact(
      mm.insertOne().from(cmt2).setParams(),
      mm.insertOne().from(postCmt).setParams(),
    );

    wrapped = this.t.wrap({ rplCount: 1, cmtID: 2 });
  }
  const postTA = mm.actionGroup(post, PostAG);
  await testBuildAsync(postTA, 'tx/callTxWrap/post');
});
