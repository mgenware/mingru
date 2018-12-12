import * as dd from 'dd-models';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/cmtReply';
import user from '../models/user';
import { testBuildAsync, newTA } from './common';

test('Select', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title);
  await testBuildAsync(ta, 'select/select');
});

test('Select all', async () => {
  const ta = newTA(post);
  ta.selectAll('t', post.id, post.title);
  await testBuildAsync(ta, 'select/selectAll');
});

test('Select field', async () => {
  const ta = newTA(post);
  ta.selectField('t', post.title);
  await testBuildAsync(ta, 'select/selectField');
});

test('Where', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(
    dd.sql`${post.id} = ${dd.input(post.id)}`,
  );
  await testBuildAsync(ta, 'select/where');
});

test('Select all, where', async () => {
  const ta = newTA(post);
  ta.selectAll('t', post.id, post.title).where(
    dd.sql`${post.id} = ${dd.input(post.id)}`,
  );
  await testBuildAsync(ta, 'select/whereAll');
});

test('Select field, where', async () => {
  const ta = newTA(post);
  ta.selectField('t', post.user_id).byID();
  await testBuildAsync(ta, 'select/whereField');
});

test('Where: multiple cols', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(
    dd.sql`${post.id} = ${dd.input(post.id)} && ${post.title} != ${dd.input(
      post.title,
    )}`,
  );
  await testBuildAsync(ta, 'select/whereMultipleCols');
});

test('Custom params', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(
    dd.sql`${post.id} = ${dd.input(post.id, 'id')} && raw_name = ${dd.input(
      'string',
      'name',
    )}`,
  );
  await testBuildAsync(ta, 'select/customParams');
});

test('Basic join', async () => {
  const ta = newTA(post);
  ta.select('t', post.user_id.join(user).url_name, post.title);
  await testBuildAsync(ta, 'select/joinBasic');
});

test('Same table, multiple cols join', async () => {
  const ta = newTA(rpl);
  ta.select(
    't',
    rpl.user_id.join(user).url_name,
    rpl.user_id.join(user).id,
    rpl.to_user_id.join(user).url_name,
  );
  await testBuildAsync(ta, 'select/joinCols');
});

test('AS', async () => {
  const ta = newTA(cmt);
  ta.select(
    't',
    cmt.id,
    cmt.user_id.as('a'),
    cmt.target_id.join(post).title.as('b'),
    cmt.target_id.join(post).user_id.join(user).url_name,
    cmt.target_id
      .join(post)
      .user_id.join(user)
      .url_name.as('c'),
  );
  await testBuildAsync(ta, 'select/joinAs');
});

test('Duplicate selected names', async () => {
  const ta = newTA(post);
  ta.select(
    't',
    post.title,
    post.title,
    post.title.as('a'),
    post.title,
    post.title.as('a'),
    post.user_id.as('a'),
    post.user_id.join(user).url_name,
    post.user_id.join(user).url_name,
    post.user_id.join(user).url_name.as('a'),
  );
  await testBuildAsync(ta, 'select/joinDup');
});
