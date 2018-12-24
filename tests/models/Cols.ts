import * as dd from 'dd-models';
import user from './user';

class Cols extends dd.Table {
  id = dd.pk();
  notNull = dd.text();
  nullable = dd.int().nullable;
  fk = user.id;
  def = dd.int(-3);
  defTime = dd.time();
}

export default dd.table(Cols);
