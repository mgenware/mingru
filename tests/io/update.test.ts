import * as mr from '../../';
import * as dd from 'dd-models';
import post from '../models/post';

const dialect = new mr.MySQL();

test('Update', () => {
  const actions = dd.actions(post);
  const v = actions
    .update('t')
    .set(post.title, dd.sql`"haha"`)
    .set(post.content, dd.sql`${dd.input(post.content)}`)
    .set(post.cmtCount, dd.sql`${post.cmtCount} + 1`);
  const io = mr.io.toUpdateIO(v, dialect);

  expect(io).toBeInstanceOf(mr.io.UpdateIO);
  expect(io.sql).toBe(
    'UPDATE `post` SET `title` = "haha", `content` = ?, `cmt_c` = `cmt_c` + 1',
  );
  expect(io.table).toBeInstanceOf(mr.io.TableIO);
  expect(io.setters.length).toBe(3);
  expect(io.setters[0].col).toBe(post.title);
  expect(io.setters[0].sql.sql.toString()).toBe('"haha"');
  expect(io.setters[1].col).toBe(post.content);
  expect(io.setters[2].col).toBe(post.cmtCount);
});

test('Update with where', () => {
  const actions = dd.actions(post);
  const v = actions
    .update('t')
    .set(post.title, dd.sql`"haha"`)
    .where(dd.sql`${post.id} = 1`);
  const io = mr.io.toUpdateIO(v, dialect);

  expect(io.sql).toBe('UPDATE `post` SET `title` = "haha" WHERE `id` = 1');
});
