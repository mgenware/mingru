import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync, newTA } from './common';

test('Update', async () => {
  const ta = newTA(post);
  ta.update('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, dd.sql`${dd.input(post.content)}`)
    .set(post.cmtCount, dd.sql`${post.cmtCount} + 1`);
  await testBuildAsync(ta, 'update/update');
});
