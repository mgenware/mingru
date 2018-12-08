import post from '../models/post';
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
