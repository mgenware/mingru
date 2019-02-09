import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import { testBuildFullAsync, newTA } from './common';

test('Single action', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title);
  await testBuildFullAsync(ta, 'goBuilder/singleAction');
});

test('Multiple actions', async () => {
  const ta = newTA(post);
  ta.select('PostTitle', post.id, post.title);
  ta.select(
    'PostInfo',
    post.id,
    post.title,
    post.user_id,
    post.user_id.join(user).url_name,
  );
  ta.updateAll('PostTitle').set(post.title, dd.sql`${dd.input(post.title)}`);
  ta.delete('ByID').where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  await testBuildFullAsync(ta, 'goBuilder/multipleActions');
});