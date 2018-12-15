import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync, newTA } from './common';

test('Delete', async () => {
  const ta = newTA(post);
  ta.delete('t');
  await testBuildAsync(ta, 'delete/delete');
});

test('Delete with where', async () => {
  const ta = newTA(post);
  ta.delete('t').where(dd.sql`${post.user_id} = ${dd.input(post.user_id)}`);
  await testBuildAsync(ta, 'delete/deleteWithWhere');
});

test('DeleteOne', async () => {
  const ta = newTA(post);
  ta.deleteOne('t');
  await testBuildAsync(ta, 'delete/deleteOne');
});
