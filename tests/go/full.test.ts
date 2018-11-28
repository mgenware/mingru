import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildFullAsync } from './common';

function newTA(table: dd.Table): dd.TableActionCollection {
  return dd.actions(table);
}

test('Single action', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title);
  await testBuildFullAsync(ta, 'full/singleAction');
});
