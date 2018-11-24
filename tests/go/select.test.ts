import post from '../models/post';
import * as dd from 'dd-models';
import { testBuilderAsync } from './common';

function newTA(): dd.TableActionCollection {
  return dd.actions(post);
}

test('Cols', async () => {
  const ta = newTA();
  ta.select('t', post.id, post.title);
  await testBuilderAsync(ta, 'select/cols');
});
