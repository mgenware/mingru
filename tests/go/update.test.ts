import * as mm from 'mingru-models';
import post from '../models/post.js';
import { testBuildAsync } from './common.js';
import cols from '../models/cols.js';

it('UpdateSome', async () => {
  class PostAG extends mm.ActionGroup {
    updateT = mm
      .updateSome()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.param(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'update/update');
});

it('UpdateOne', async () => {
  class PostAG extends mm.ActionGroup {
    updateT = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.param(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'update/updateOne');
});

it('Update with where', async () => {
  class PostAG extends mm.ActionGroup {
    updateT = mm
      .updateOne()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, post.content.toParam())
      .whereSQL(
        mm.sql`${post.id} = ${post.id.toParam()} AND ${post.content} = ${post.content.toParam(
          'content2',
        )}`,
      );
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'update/updateWithWhere');
});

it('Update with non-input setters', async () => {
  class PostAG extends mm.ActionGroup {
    updateT = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, post.content.toParam());
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'update/updateWithNonInputSetters');
});

it('Duplicate names in WHERE and setters', async () => {
  class PostAG extends mm.ActionGroup {
    updateT = mm
      .updateSome()
      .set(post.content, post.content.toParam())
      .set(post.title, mm.sql`"haha"`)
      .set(post.m_user_id, post.m_user_id.toParam())
      .whereSQL(
        mm.sql`${post.title.isEqualToParam()} ${post.title.isEqualToParam()} AND ${post.content.isEqualToParam()}`,
      );
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'update/dupNamesWhereSetters');
});

it('Custom DB column name', async () => {
  class PostAG extends mm.ActionGroup {
    updateT = mm
      .unsafeUpdateAll()
      .set(post.title, mm.sql`"haha"`)
      .set(post.content, mm.sql`${mm.param(post.content)}`)
      .set(post.cmtCount, mm.sql`${post.cmtCount} + 1`)
      .by(post.id);
  }
  const ta = mm.actionGroup(post, PostAG);
  await testBuildAsync(ta, 'update/customName');
});

it('Update with defaults', async () => {
  class ColsAG extends mm.ActionGroup {
    updateT = mm.updateOne().setParams(cols.fk).setDefaults().by(cols.id);
  }
  const ta = mm.actionGroup(cols, ColsAG);
  await testBuildAsync(ta, 'update/updateWithDefaults');
});

it('Update with defaults and inputs', async () => {
  class ColsAG extends mm.ActionGroup {
    updateT = mm.updateOne().setDefaults().setParams().by(cols.id);
  }
  const ta = mm.actionGroup(cols, ColsAG);
  await testBuildAsync(ta, 'update/updateWithDefaultsAndInputs');
});
