import * as mm from 'mingru-models';
import user from './user';

class Cols extends mm.Table {
  id = mm.pk();
  text = mm.text('');
  int = mm.int(0);
  nullable = mm.int(null).nullable;
  fk = user.id;
  defInt = mm.int(-3);
  defVarChar = mm.varChar(100, '一二');
  defTime = mm.time(true);
}

export default mm.table(Cols);
