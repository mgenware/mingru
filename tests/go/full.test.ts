import * as dd from 'dd-models';
import user from '../models/user';
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
  ta.update('PostTitle').set(post.title, dd.sql`${dd.input(post.title)}`);
  ta.delete('ByID').where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  await testBuildFullAsync(ta, 'full/multipleActions');
});
