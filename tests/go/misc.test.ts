import * as mm from 'mingru-models';
import cols from '../models/cols.js';
import post from '../models/post.js';
import user from '../models/user.js';
import { testBuildAsync } from './common.js';

it('Ghost table', async () => {
  class Ghost extends mm.GhostTable {}
  const ghost = mm.table(Ghost);
  class GhostAG extends mm.ActionGroup {
    selectT = mm.selectRows(post.id, post.title).from(post).orderByAsc(post.id);
    insertT = mm.insert().from(cols).setParams(cols.fk).setDefaults();
  }
  const ta = mm.actionGroup(ghost, GhostAG);
  await testBuildAsync(ta, 'misc/ghostTable');
});

it('toParamsAdv (All columns NOT NULL)', async () => {
  class T extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable;
    name = mm.varChar(10).nullable;
  }
  const t = mm.table(T);
  class TAG extends mm.ActionGroup {
    insert = mm.insertOne().setParamsAdv([], { toParamOpt: { nullable: false } });

    edit = mm
      .updateOne()
      .setParamsAdv([], { toParamOpt: { nullable: false } })
      .by(t.id);
  }
  const ta = mm.actionGroup(t, TAG);
  await testBuildAsync(ta, 'misc/notNullToParams');
});

it('toParamsAdv (Some columns NOT NULL)', async () => {
  class T extends mm.Table {
    id = mm.pk();
    user_id = mm.fk(user.id).nullable;
    name = mm.varChar(10).nullable;
  }
  const t = mm.table(T);
  class TAG extends mm.ActionGroup {
    insert = mm.insertOne().setParamsAdv([], {
      toParamCallback: (col) => (col === t.user_id ? t.user_id.toParamNotNull() : col.toParam()),
    });

    edit = mm
      .updateOne()
      .setParamsAdv([], {
        toParamCallback: (col) => (col === t.user_id ? t.user_id.toParamNotNull() : col.toParam()),
      })
      .by(t.id);
  }
  const ta = mm.actionGroup(t, TAG);
  await testBuildAsync(ta, 'misc/notNullSomeToParams');
});
