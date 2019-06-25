import { testBuildAsync } from './common';
import * as dd from 'dd-models';

test('No inserted ID', async () => {
  class Employee extends dd.Table {
    id = dd.pk(dd.int()).setDBName('emp_no').noAutoIncrement;
    firstName = dd.varChar(50);
    lastName = dd.varChar(50);
    gender = dd.varChar(10);
    birthDate = dd.date();
    hireDate = dd.date();
  }
  const employee = dd.table(Employee, 'employees');
  class EmployeeTA extends dd.TA {
    insert = dd.insert().setInputs();
  }
  const employeeTA = dd.ta(employee, EmployeeTA);
  class Dept extends dd.Table {
    no = dd.pk(dd.char(4)).setDBName('dept_no');
    name = dd.varChar(40).setDBName('dept_name');
  }

  const dept = dd.table(Dept, 'departments');
  class DeptTA extends dd.TA {
    insert = dd.insert().setInputs();
  }
  const deptTA = dd.ta(dept, DeptTA);
  class DeptManager extends dd.Table {
    empNo = employee.id;
    deptNo = dept.no;
    fromDate = dd.date();
    toDate = dd.date();
  }
  const deptManager = dd.table(DeptManager, 'dept_manager');
  class DeptManagerTA extends dd.TA {
    insertCore = dd.insert().setInputs();
    insert = dd.transact(employeeTA.insert, deptTA.insert, this.insertCore);
  }

  const deptManagerTA = dd.ta(deptManager, DeptManagerTA);
  await testBuildAsync(employeeTA, 'tx/noInsID/employee');
  await testBuildAsync(deptTA, 'tx/noInsID/dept');
  await testBuildAsync(deptManagerTA, 'tx/noInsID/deptManager');
});

test('Last inserted ID', async () => {
  class Employee extends dd.Table {
    id = dd.pk(dd.int()).setDBName('emp_no');
    firstName = dd.varChar(50);
  }
  const employee = dd.table(Employee, 'employees');
  class EmployeeTA extends dd.TA {
    insert = dd.insertOne().setInputs();
    insert2 = dd.transact(this.insert, this.insert);
  }
  const employeeTA = dd.ta(employee, EmployeeTA);
  await testBuildAsync(employeeTA, 'tx/autoInsID/employee');
});
