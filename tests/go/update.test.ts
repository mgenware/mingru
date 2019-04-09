import * as dd from 'dd-models';
import post from '../models/post';
import { testBuildAsync, newTA } from './common';

test('Update', async () => {
  const ta = newTA(post);
  ta.update('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, dd.sql`${dd.input(post.content)}`)
    .set(post.cmtCount, dd.sql`${post.cmtCount} + 1`)
    .byID();
  await testBuildAsync(ta, 'update/update');
});

test('UpdateOne', async () => {
  const ta = newTA(post);
  ta.updateOne('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, dd.sql`${dd.input(post.content)}`)
    .set(post.cmtCount, dd.sql`${post.cmtCount} + 1`)
    .byID();
  await testBuildAsync(ta, 'update/updateOne');
});

test('Update with where', async () => {
  const ta = newTA(post);
  ta.updateOne('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, post.content.toInput())
    .where(
      dd.sql`${post.id} = ${post.id.toInput()} AND ${
        post.content
      } = ${post.content.toInput()}`,
    );
  await testBuildAsync(ta, 'update/updateWithWhere');
});

test('Update with non-input setters', async () => {
  const ta = newTA(post);
  ta.updateAll('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, post.content.toInput());
  await testBuildAsync(ta, 'update/updateWithNonInputSetters');
});

test('Duplicate names in where and setters', async () => {
  const ta = newTA(post);
  ta.update('t')
    .set(post.content, post.content.toInput())
    .set(post.title, dd.sql`"haha"`)
    .where(
      dd.sql`${post.title.isEqualToInput()} AND ${post.content.isEqualToInput()}`,
    );
  await testBuildAsync(ta, 'update/updateWithDupVars');
});

test('Custom DB column name', async () => {
  const ta = newTA(post);
  ta.update('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, dd.sql`${dd.input(post.content)}`)
    .set(post.cmtCount, dd.sql`${post.cmtCount} + 1`)
    .byID();
  await testBuildAsync(ta, 'update/customName');
});
