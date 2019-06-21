import * as dd from 'dd-models';

class Dept extends dd.Table {
  no = dd.pk(dd.char(4)).setDBName('dept_no');
  name = dd.varChar(40).setDBName('dept_name');
}

export default dd.table(Dept, 'departments');
