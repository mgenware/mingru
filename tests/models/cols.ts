import * as dd from 'dd-models';
import user from './user';

class Cols extends dd.Table {
  id = dd.pk();
  text = dd.text();
  int = dd.int();
  nullable = dd.int().nullable;
  fk = user.id;
  defInt = dd.int(-3);
  defVarChar = dd.varChar(100, '一二');
  defTime = dd.time(true);
}

export default dd.table(Cols);
