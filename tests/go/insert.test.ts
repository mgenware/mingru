import post from '../models/post';
import { testBuildAsync, newTA } from './common';

test('Insert', async () => {
  const ta = newTA(post);
  ta.insert('t', post.title, post.user_id);
  await testBuildAsync(ta, 'insert/insert');
});
