import * as dd from 'dd-models';
import post from '../models/post';
import cols from '../models/cols';
import { testBuildAsync, newTA } from './common';

test('Insert', async () => {
  const ta = newTA(post);
  ta.insert('t').setInputs(post.title, post.user_id);
  await testBuildAsync(ta, 'insert/insert');
});

test('InsertOne', async () => {
  const ta = newTA(post);
  ta.insertOne('t').setInputs(post.title, post.user_id);
  await testBuildAsync(ta, 'insert/insertOne');
});

test('Insert with non-input setters', async () => {
  const ta = newTA(post);
  ta.insert('t')
    .setInputs(post.title, post.user_id)
    .set(post.content, dd.sql`"haha"`);
  await testBuildAsync(ta, 'insert/insertWithNonInputSetters');
});

test('Default values', async () => {
  const ta = newTA(post);
  ta.insert('t').setInputs(post.title, post.user_id);
  await testBuildAsync(ta, 'insert/insert');
});

test('insertWithDefaults', async () => {
  const ta = newTA(cols);
  ta.insertWithDefaults('t').setInputs(cols.fk);
  await testBuildAsync(ta, 'insert/insertWithDefaults');
});
