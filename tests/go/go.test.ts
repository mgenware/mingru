import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync, newTA } from './common';

test('Escape string', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(
    dd.sql`${post.title} = "\\\\a\\\""`,
  );
  await testBuildAsync(ta, 'go/escapeString');
});
