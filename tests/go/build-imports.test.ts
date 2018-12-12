import * as dd from 'dd-models';
import post from '../models/post';
import { newTA, testBuildToDirAsync } from './common';

test('Select', async () => {
  const ta = newTA(post);
  ta.selectAll('Times', post.datetime, post.date);
  ta.selectAll('NullableTimes', post.n_datetime, post.n_date);
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsSelect');
});

test('Select (where)', async () => {
  const ta = newTA(post);
  ta.selectAll('Times', post.datetime, post.date).where(
    dd.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
      post.n_date
    } = ${post.n_date.toInput()}`,
  );
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsSelectWhere');
});

test('Select field', async () => {
  const ta = newTA(post);
  ta.selectField('Time', post.n_datetime);
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsSelectField');
});

test('Update', async () => {
  const ta = newTA(post);
  ta.update('Times').setInputs(post.datetime, post.date);
  ta.update('NullableTimes').setInputs(post.n_datetime, post.n_date);
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsUpdate');
});

test('Update (where)', async () => {
  const ta = newTA(post);
  ta.update('Times')
    .setInputs(post.datetime)
    .where(
      dd.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
        post.n_date
      } = ${post.n_date.toInput()}`,
    );
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsUpdateWhere');
});

test('Delete (where)', async () => {
  const ta = newTA(post);
  ta.deleteOne('Times').where(
    dd.sql`${post.n_datetime} = ${post.n_datetime.toInput()} OR ${
      post.n_date
    } = ${post.n_date.toInput()}`,
  );
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsDeleteWhere');
});

test('Insert', async () => {
  const ta = newTA(post);
  ta.insertOne('Times').setInputs(post.datetime, post.n_datetime);
  await testBuildToDirAsync([ta], ['Post'], 'extraImportsInsert');
});
