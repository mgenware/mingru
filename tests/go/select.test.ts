import * as dd from 'mingru-models';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/postReply';
import user from '../models/user';
import { testBuildAsync } from './common';
import * as assert from 'assert';
import postCategory from '../models/postCategory';
import category from '../models/category';
import cmt2 from '../models/cmt2';
import postCmt from '../models/postCmt';

it('select', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.select(post.id, post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/select');
});

it('select, all rows', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.select();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectAll');
});

it('selectRows', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.selectRows(post.id, post.title).orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectRows');
});

it('selectRows', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.selectRows().orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectAllRows');
});

it('selectField', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.selectField(post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectField');
});

it('WHERE', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .select(post.id, post.title)
      .where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/where');
});

it('selectRows with WHERE', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .selectRows(post.id, post.title)
      .where(dd.sql`${post.id} = ${dd.input(post.id)}`)
      .orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsWhere');
});

it('selectRows, WHERE, orderBy', async () => {
  const cc = dd.sel('RAND()', 'n', new dd.ColumnType(dd.dt.int));
  class PostTA extends dd.TableActions {
    selectT = dd
      .selectRows(post.id, cc, post.title)
      .where(dd.sql`${post.id} = ${post.id.toInput()} ${post.id.toInput()}`)
      .orderByAsc(post.title)
      .orderByAsc(cc)
      .orderByDesc(post.title)
      .orderByAsc(post.cmtCount);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsWhereOrder');
});

it('selectField, WHERE', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.selectField(post.user_id).byID();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/whereField');
});

it('WHERE: multiple cols', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .select(post.id, post.title)
      .where(
        dd.sql`${post.id} = ${dd.input(post.id)} && ${post.title} != ${dd.input(
          post.title,
        )}`,
      );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/whereMultipleCols');
});

it('Custom params', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .select(post.id, post.title)
      .where(
        dd.sql`${post.id} = ${dd.input(post.id, 'id')} && raw_name = ${dd.input(
          'string',
          'name',
        )}`,
      );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/customParams');
});

it('Basic join', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.select(post.user_id.join(user).url_name, post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/joinBasic');
});

it('Basic join (rows)', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .selectRows(post.user_id.join(user).url_name, post.title)
      .where(dd.sql`${post.user_id.join(user).sig}-${post.user_id}`)
      .orderByAsc(post.user_id.join(user).sig)
      .orderByDesc(post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/joinBasicRows');
});

it('Join implied by WHERE', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .select(post.title)
      .where(post.user_id.join(user).url_name.isEqualToInput());
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/joinImpliedByWhere');
});

it('Inverse join (select from A on A.id = B.a_id)', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .selectRows(
        post.title,
        post.id
          .join(postCategory, postCategory.post_id)
          .category_id.setInputName('category_id'),
        post.id
          .join(postCategory, postCategory.post_id)
          .category_id.join(category)
          .id.setInputName('id'),
      )
      .where(
        dd.sql`${post.title}|${post.id
          .join(postCategory, postCategory.post_id)
          .category_id.setInputName('category_id')}|${post.id
          .join(postCategory, postCategory.post_id)
          .category_id.join(category)
          .id.setInputName('id')}`,
      )
      .orderByAsc(
        post.id
          .join(postCategory, postCategory.post_id)
          .category_id.join(category).id,
      )
      .orderByDesc(post.user_id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/inverseJoin');
});

it('Same table, multiple cols join', async () => {
  class RplTA extends dd.TableActions {
    selectT = dd.select(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = dd.ta(rpl, RplTA);
  await testBuildAsync(ta, 'select/joinCols');
});

it('Join as', async () => {
  class CmtTA extends dd.TableActions {
    selectT = dd.select(
      cmt.id,
      cmt.user_id.as('a'),
      cmt.target_id.join(post).title.as('b'),
      cmt.target_id.join(post).user_id.join(user).url_name,
      cmt.target_id
        .join(post)
        .user_id.join(user)
        .url_name.as('c'),
    );
  }
  const ta = dd.ta(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinAs');
});

it('Join and from', async () => {
  const jCmt = postCmt.cmt_id.join(cmt2);
  class CmtTA extends dd.TableActions {
    selectT = dd
      .select(
        jCmt.content,
        jCmt.created_at,
        jCmt.modified_at,
        jCmt.rpl_count,
        jCmt.user_id,
        jCmt.user_id.join(user).url_name,
      )
      .from(postCmt)
      .by(postCmt.post_id);
  }
  const ta = dd.ta(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinAndFrom');
});

it('Selected name collisions', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.select(
      post.title,
      post.title,
      post.title.as('a'),
      post.title,
      post.title.as('a'),
      post.user_id.as('a'),
      post.user_id.join(user).url_name,
      post.user_id.join(user).url_name,
      post.user_id.join(user).url_name.as('a'),
    );
  }
  const ta = dd.ta(post, PostTA);
  assert.rejects(testBuildAsync(ta, ''), 'already exists');
});

it('Calculated columns', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.select(
      // User specified types
      new dd.RawColumn(dd.sql`raw expr`, 'a', new dd.ColumnType(dd.dt.bigInt)),
      new dd.RawColumn(
        dd.sql`xyz(${post.n_date})`,
        'b',
        new dd.ColumnType(dd.dt.smallInt),
      ),
      new dd.RawColumn(
        dd.sql`xyz(${post.user_id.join(user).display_name})`,
        'c',
        new dd.ColumnType(dd.dt.int),
      ),
      // Auto detected types
      new dd.RawColumn(post.user_id.join(user).display_name, 'snake_name'),
      new dd.RawColumn(dd.count(post.n_datetime)),
    );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/rawColumn');
});

it('Custom DB names', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd.select(
      post.cmtCount, // cmtCount is set to cmt_c in models via `setDBName`
      post.m_user_id,
      post.m_user_id.as('a'),
      post.m_user_id.join(user).follower_count,
      post.m_user_id.join(user).follower_count.as('fc'),
    );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/modifiedDBNames');
});

it('selectRows, paginate', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .selectRows(post.id, post.title)
      .limit()
      .orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsPaginate');
});

it('selectRows, paginate, where', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .selectRows(post.id, post.title)
      .byID()
      .limit()
      .orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsPaginateWithWhere');
});

it('selectPage', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .selectPage(post.id, post.title)
      .byID()
      .orderByAsc(post.id);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectPage');
});

it('WHERE, inputs, joins', async () => {
  class CmtTA extends dd.TableActions {
    selectT = dd.select(cmt.id).where(
      dd.sql` ${cmt.id.toInput()}, ${cmt.user_id.toInput()}, ${cmt.target_id
        .join(post)
        .title.toInput()}, ${cmt.target_id
        .join(post)
        .user_id.join(user)
        .url_name.toInput()}`,
    );
  }
  const ta = dd.ta(cmt, CmtTA);
  await testBuildAsync(ta, 'select/whereInputsJoins');
});

it('Argument stubs', async () => {
  class PostTA extends dd.TableActions {
    selectT = dd
      .select(post.id, post.title)
      .argStubs(
        new dd.SQLVariable('int', 'id1'),
        new dd.SQLVariable('int', 'id2'),
      );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/argStubs');
});

it('GROUP BY and HAVING', async () => {
  const yearCol = dd.sel(dd.year(post.datetime), 'year');
  class PostTA extends dd.TableActions {
    t = dd
      .select(yearCol, dd.sel(dd.sum(post.cmtCount), 'total'))
      .byID()
      .groupBy(yearCol, 'total')
      .having(
        dd.and(
          dd.sql`${yearCol} > ${yearCol.toInput()}`,
          dd.sql`\`total\` > ${dd.int().toInput('total')}`,
        ),
      );
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/groupByAndHaving');
});
