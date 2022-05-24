import * as mm from 'mingru-models';
import user from './user.js';

class Cols extends mm.Table {
  id = mm.pk();
  text = mm.text().default('');
  int = mm.int().default(0);
  nullable = mm.int().default(null).nullable;
  fk = user.id;
  defInt = mm.int().default(-3);
  defVarChar = mm.varChar(100).default('一二');
  defTime = mm.time({ defaultToNow: 'server' });
}

export default mm.table(Cols);
