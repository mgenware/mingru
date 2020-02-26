import { testBuildAsync } from './common';
import * as mm from 'mingru-models';
import cmt2 from '../models/cmt2';
import postCmt from '../models/postCmt';
import post from '../models/post';

it('Declare return types', async () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
  }
  const employee = mm.table(Employee, 'employees');
  class EmployeeTA extends mm.TableActions {
    insert = mm.insertOne().setInputs();
    insert2 = mm
      .transact(
        this.insert,
        this.insert.declareReturnValues({
          [mm.ReturnValues.insertedID]: 'id2',
        }),
      )
      .setReturnValues('id2');
  }
  const employeeTA = mm.tableActions(employee, EmployeeTA);
  await testBuildAsync(employeeTA, 'tx/declareRetFromInsert/employee');
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
  const employee = mm.table(Employee, 'employees');
  class EmployeeTA extends mm.TableActions {
    insertEmp = mm.insertOne().setInputs();
  }
  const employeeTA = mm.tableActions(employee, EmployeeTA);
  class Dept extends mm.Table {
    no = mm.pk().setDBName('dept_no');
    name = mm.varChar(40).setDBName('dept_name');
  }

  const dept = mm.table(Dept, 'departments');
  class DeptTA extends mm.TableActions {
    insertDept = mm.insertOne().setInputs();
  }
  const deptTA = mm.tableActions(dept, DeptTA);
  class DeptManager extends mm.Table {
    empNo = employee.id;
    deptNo = dept.no;
    fromDate = mm.date();
    toDate = mm.date();
  }
  const deptManager = mm.table(DeptManager, 'dept_manager');
  const empNo = 'empNo';
  const deptNo = 'deptNo';
  class DeptManagerTA extends mm.TableActions {
    insertCore = mm.insertOne().setInputs();
    insert = mm
      .transact(
        employeeTA.insertEmp.declareReturnValue(
          mm.ReturnValues.insertedID,
          empNo,
        ),
        deptTA.insertDept.declareReturnValue(
          mm.ReturnValues.insertedID,
          deptNo,
        ),
        this.insertCore.wrapAsRefs({
          empNo,
          deptNo,
        }),
      )
      .setReturnValues(deptNo, empNo);
  }

  const deptManagerTA = mm.tableActions(deptManager, DeptManagerTA);
  await testBuildAsync(employeeTA, 'tx/multipleRetValues/employee');
  await testBuildAsync(deptTA, 'tx/multipleRetValues/dept');
  await testBuildAsync(deptManagerTA, 'tx/multipleRetValues/deptManager');
});

it('Temp member actions', async () => {
  class User extends mm.Table {
    id = mm.pk();
    postCount = mm.int();
  }
  const user = mm.table(User);
  class UserTA extends mm.TableActions {
    updatePostCount = mm
      .updateOne()
      .set(
        user.postCount,
        mm.sql`${user.postCount} + ${mm.input(mm.int(), 'offset')}`,
      )
      .byID();
  }
  const userTA = mm.tableActions(user, UserTA);
  class Post extends mm.Table {
    id = mm.pk();
    title = mm.varChar(200);
  }

  const post = mm.table(Post, 'db_post');
  class PostTA extends mm.TableActions {
    insertCore = mm.insertOne().setInputs();
    insert = mm.transact(
      userTA.updatePostCount.wrap({ offset: 1 }),
      this.insertCore,
      mm
        .updateOne()
        .setInputs()
        .byID(),
      mm
        .updateOne()
        .setInputs()
        .byID()
        .wrap({ title: '"TITLE"' }),
      this.insertCore.wrap({ title: '"abc"' }),
    );
  }
  const postTA = mm.tableActions(post, PostTA);
  await testBuildAsync(userTA, 'tx/tmpActions/user');
  await testBuildAsync(postTA, 'tx/tmpActions/post');
});

it('Temp member actions (with from)', async () => {
  class PostTA extends mm.TableActions {
    t = mm.transact(
      mm
        .insertOne()
        .from(cmt2)
        .setInputs(),
      mm
        .insertOne()
        .from(postCmt)
        .setInputs(),
    );
  }
  const postTA = mm.tableActions(post, PostTA);
  await testBuildAsync(postTA, 'tx/tmpActionsWithFrom/post');
});
