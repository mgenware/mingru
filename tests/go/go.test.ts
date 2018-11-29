import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync } from './common';

function newTA(table: dd.Table): dd.TableActionCollection {
  return dd.actions(table);
}

test('Basic', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(dd.sql`${post.title} = "<>\""`);
  await testBuildAsync(ta, 'go/escapeString');
});
