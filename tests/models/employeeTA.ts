import * as dd from 'dd-models';
import t from './employee';

export class EmployeeTA extends dd.TA {
  insert = dd.insertOne().setInputs();
}

export default dd.ta(t, EmployeeTA);
