import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync } from './common';

function newTA(table: dd.Table): dd.TableActionCollection {
  return dd.actions(table);
}

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
