import * as dd from 'dd-models';
import post from '../models/post';
import rpl from '../models/cmtReply';
import user from '../models/user';
import { testBuilderAsync } from './common';

function newTA(table: dd.Table): dd.TableActionCollection {
  return dd.actions(table);
}

test('Basic', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title);
  await testBuilderAsync(ta, 'select/basic');
});

test('Select all', async () => {
  const ta = newTA(post);
  ta.selectAll('t', post.id, post.title);
  await testBuilderAsync(ta, 'select/basicAll');
});

test('Where', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  await testBuilderAsync(ta, 'select/where');
});

test('WhereAll', async () => {
  const ta = newTA(post);
  ta.selectAll('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  await testBuilderAsync(ta, 'select/whereAll');
});

test('Where: multiple cols', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id)} && ${post.title} != ${dd.input(post.title)}`);
  await testBuilderAsync(ta, 'select/whereMultipleCols');
});

test('Custom params', async () => {
  const ta = newTA(post);
  ta.select('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id, 'id')} && raw_name = ${dd.input('string', 'name')}`);
  await testBuilderAsync(ta, 'select/customParams');
});

test('Join1', async () => {
  const ta = newTA(rpl);
  ta.select(
      't',
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  await testBuilderAsync(ta, 'select/join1');
});
