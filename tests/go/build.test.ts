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

test('Multiple tables', async () => {
  const userTA = dd.actions(user);
  userTA.select('Profile', user.display_name, user.sig);
  userTA.update('Profile').set(user.sig, user.sig.isEqualToInput());
  userTA.delete('ByID').where(user.id.isEqualToInput());

  const postTA = dd.actions(post);
  postTA.select(
    'PostInfo',
    post.id,
    post.content,
    post.user_id.join(user).url_name,
  );
  postTA.update('Content').set(post.content, post.content.isEqualToInput());
  postTA.delete('ByID').where(post.id.isEqualToInput());

  const actions = [userTA, postTA];

  await testBuildToDirAsync(actions, ['Post', 'User'], 'multipleTables');
});

test('Custom package name', async () => {
  const ta = newTA(post);
  ta.select('PostTitle', post.id, post.title);
  await testBuildToDirAsync([ta], ['Post'], 'customPackageName', {
    packageName: 'haha',
  });
});

test('Extra imports (select)', async () => {
  const ta = newTA(post);
  ta.selectAll('Times', post.datetime, post.date);
  ta.selectAll('NullableTimes', post.n_datetime, post.n_date);
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsSelect');
});
