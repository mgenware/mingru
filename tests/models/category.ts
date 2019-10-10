import * as dd from 'mingru-models';

class Category extends dd.Table {
  id = dd.pk();
  name = dd.varChar(200);
}

export default dd.table(Category);
