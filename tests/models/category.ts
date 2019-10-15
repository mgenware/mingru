import * as mm from 'mingru-models';

class Category extends mm.Table {
  id = mm.pk();
  name = mm.varChar(200);
}

export default mm.table(Category);
