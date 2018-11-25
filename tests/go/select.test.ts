import post from '../models/post';
import * as dd from 'dd-models';
import { testBuilderAsync } from './common';

function newTA(): dd.TableActionCollection {
  return dd.actions(post);
}

test('Basic', async () => {
  const ta = newTA();
  ta.select('t', post.id, post.title);
  await testBuilderAsync(ta, 'select/basic');
});

test('Select all', async () => {
  const ta = newTA();
  ta.selectAll('t', post.id, post.title);
  await testBuilderAsync(ta, 'select/basicAll');
});

test('Where', async () => {
  const ta = newTA();
  ta.select('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  await testBuilderAsync(ta, 'select/where');
});

test('WhereAll', async () => {
  const ta = newTA();
  ta.selectAll('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  await testBuilderAsync(ta, 'select/whereAll');
});

test('Where: multiple cols', async () => {
  const ta = newTA();
  ta.select('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id)} && ${post.title} != ${dd.input(post.title)}`);
  await testBuilderAsync(ta, 'select/whereMultipleCols');
});

test('Custom params', async () => {
  const ta = newTA();
  ta.select('t', post.id, post.title).where(dd.sql`${post.id} = ${dd.input(post.id, 'id')} && raw_name = ${dd.input('string', 'name')}`);
  await testBuilderAsync(ta, 'select/customParams');
});