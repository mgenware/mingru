import * as mm from 'mingru-models';
import post from '../models/post';
import { testBuildAsync } from './common';
import cols from '../models/cols';

it('UpdateSome', async () => {
  class PostTA extends mm.TableActions {
    updateT = mm
      .updateSome()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .byID();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'update/update');
});

it('UpdateOne', async () => {
  class PostTA extends mm.TableActions {
    updateT = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .byID();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'update/updateOne');
});

it('Update with where', async () => {
  class PostTA extends mm.TableActions {
    updateT = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, post.content.toInput())
      .where(
        mm.sql`${post.id} = ${post.id.toInput()} AND ${
          post.content
        } = ${post.content.toInput('content2')}`,
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'update/updateWithWhere');
});

it('Update with non-input setters', async () => {
  class PostTA extends mm.TableActions {
    updateT = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, post.content.toInput());
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'update/updateWithNonInputSetters');
});

it('Duplicate names in WHERE and setters', async () => {
  class PostTA extends mm.TableActions {
    updateT = mm
      .updateSome()
      .set(post.content, post.content.toInput())
      .set(post.title, mm.sql`"haha"`)
      .set(post.m_user_id, post.m_user_id.toInput())
      .where(
        mm.sql`${post.title.isEqualToInput()} ${post.title.isEqualToInput()} AND ${post.content.isEqualToInput()}`,
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'update/dupNamesWhereSetters');
});

it('Custom DB column name', async () => {
  class PostTA extends mm.TableActions {
    updateT = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .byID();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'update/customName');
});

it('updateWithDefaults', async () => {
  class ColsTA extends mm.TableActions {
    updateT = mm
      .updateOne()
      .setInputs(cols.fk)
      .setDefaults()
      .byID();
  }
  const ta = mm.tableActions(cols, ColsTA);
  await testBuildAsync(ta, 'update/updateWithDefaults');
});
