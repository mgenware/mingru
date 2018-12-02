import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import { newTA, testBuildToDirAsync } from './common';

test('Single table', async () => {
  const ta = newTA(post);
  ta.select('PostTitle', post.id, post.title);
  ta.select(
    'PostInfo',
    post.id,
    post.title,
    post.user_id,
    post.user_id.join(user).url_name,
  );
  ta.update('PostTitle').set(post.title, dd.sql`${dd.input(post.title)}`);
  ta.delete('ByID').where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  await testBuildToDirAsync([ta], ['Post'], 'singleTable');
});
