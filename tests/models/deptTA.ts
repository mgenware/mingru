import * as dd from 'dd-models';
import t from './dept';

export class DeptTA extends dd.TA {
  insert = dd.insertOne().setInputs();
}

export default dd.ta(t, DeptTA);
