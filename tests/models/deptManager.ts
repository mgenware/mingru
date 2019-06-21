import * as dd from 'dd-models';

class DeptManager extends dd.Table {
  empNo = dd.pk(dd.int()).setDBName('emp_no');
  deptNo = dd.pk(dd.char(4)).setDBName('dept_no');
  fromDate = dd.date();
  toDate = dd.date();
}

export default dd.table(DeptManager, 'dept_manager');
