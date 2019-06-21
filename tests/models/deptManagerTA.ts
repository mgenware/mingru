import * as dd from 'dd-models';
import t from './deptManager';
import employeeTA from './employeeTA';
import deptTA from './deptTA';

export class DeptManagerTA extends dd.TA {
  insertCore = dd.insertOne().setInputs();
  insert = dd.transact(employeeTA.insert, deptTA.insert, this.insertCore);
}

export default dd.ta(t, DeptManagerTA);
