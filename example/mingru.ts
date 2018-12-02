import * as mr from '../';
import actions from './actions';

(async () => {
  await mr.build(actions, new mr.MySQL(), './build/');
})();
