import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync } from './common';

function newTA(table: dd.Table): dd.TableActionCollection {
  return dd.actions(table);
}

test('Basic', async () => {
  const ta = newTA(post);
  ta.update('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, dd.sql`${dd.input(post.content)}`)
    .set(post.cmtCount, dd.sql`${post.cmtCount} + 1`);
  await testBuildAsync(ta, 'update/update');
});
