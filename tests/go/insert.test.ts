import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync } from './common';

function newTA(table: dd.Table): dd.TableActionCollection {
  return dd.actions(table);
}

test('Basic', async () => {
  const ta = newTA(post);
  ta.insert('t', post.title, post.user_id);
  await testBuildAsync(ta, 'insert/basic');
});
