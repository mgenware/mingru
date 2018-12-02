import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import cmtReply from '../models/cmtReply';
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
  const postTA = newTA(post);
  postTA.select('PostTitle', post.id, post.title);
  postTA.select(
    'PostInfo',
    post.id,
    post.title,
    post.user_id,
    post.user_id.join(user).url_name,
  );
  postTA.update('PostTitle').set(post.title, dd.sql`${dd.input(post.title)}`);
  postTA.delete('ByID').where(dd.sql`${post.id} = ${dd.input(post.id)}`);

  const rplTA = newTA(cmtReply);
  rplTA.select(
    'Replies',
    cmtReply.id,
    cmtReply.user_id.join(user).url_name,
    cmtReply.to_user_id.join(user).url_name,
  );
  rplTA
    .update('User')
    .set(cmtReply.user_id, dd.sql`${dd.input(cmtReply.user_id)}`);
  rplTA.delete('ByID').where(dd.sql`${cmtReply.id} = ${dd.input(cmtReply.id)}`);

  await testBuildToDirAsync(
    [postTA, rplTA],
    ['Post', 'PostCmtRpl'],
    'multipleTables',
  );
});
