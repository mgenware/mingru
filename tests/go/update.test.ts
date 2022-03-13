import * as mm from 'mingru-models';
import post from '../models/post.js';
import { testBuildAsync } from './common.js';
import cols from '../models/cols.js';

it('UpdateSome', async () => {
  class PostTA extends mm.ActionGroup {
    updateT = mm
      .updateSome()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const ta = mm.actionGroup(post, PostTA);
  await testBuildAsync(ta, 'update/update');
});

it('UpdateOne', async () => {
  class PostTA extends mm.ActionGroup {
    updateT = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const ta = mm.actionGroup(post, PostTA);
  await testBuildAsync(ta, 'update/updateOne');
});

it('Update with where', async () => {
  class PostTA extends mm.ActionGroup {
    updateT = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, post.content.toInput())
      .whereSQL(
        mm.sql`${post.id} = ${post.id.toInput()} AND ${post.content} = ${post.content.toInput(
          'content2',
        )}`,
      );
  }
  const ta = mm.actionGroup(post, PostTA);
  await testBuildAsync(ta, 'update/updateWithWhere');
});

it('Update with non-input setters', async () => {
  class PostTA extends mm.ActionGroup {
    updateT = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, post.content.toInput());
  }
  const ta = mm.actionGroup(post, PostTA);
  await testBuildAsync(ta, 'update/updateWithNonInputSetters');
});

it('Duplicate names in WHERE and setters', async () => {
  class PostTA extends mm.ActionGroup {
    updateT = mm
      .updateSome()
      .set(post.content, post.content.toInput())
      .set(post.title, mm.sql`"haha"`)
      .set(post.m_user_id, post.m_user_id.toInput())
      .whereSQL(
        mm.sql`${post.title.isEqualToInput()} ${post.title.isEqualToInput()} AND ${post.content.isEqualToInput()}`,
      );
  }
  const ta = mm.actionGroup(post, PostTA);
  await testBuildAsync(ta, 'update/dupNamesWhereSetters');
});

it('Custom DB column name', async () => {
  class PostTA extends mm.ActionGroup {
    updateT = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.input(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const ta = mm.actionGroup(post, PostTA);
  await testBuildAsync(ta, 'update/customName');
});

it('Update with defaults', async () => {
  class ColsTA extends mm.ActionGroup {
    updateT = mm.updateOne().setInputs(cols.fk).setDefaults().by(cols.id);
  }
  const ta = mm.actionGroup(cols, ColsTA);
  await testBuildAsync(ta, 'update/updateWithDefaults');
});

it('Update with defaults and inputs', async () => {
  class ColsTA extends mm.ActionGroup {
    updateT = mm.updateOne().setDefaults().setInputs().by(cols.id);
  }
  const ta = mm.actionGroup(cols, ColsTA);
  await testBuildAsync(ta, 'update/updateWithDefaultsAndInputs');
});
