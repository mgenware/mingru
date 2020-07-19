import * as mm from 'mingru-models';
import { itRejects } from 'it-throws';
import * as mr from '../..';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/postReply';
import user from '../models/user';
import { testBuildAsync } from './common';
import postCategory from '../models/postCategory';
import category from '../models/category';
import cmt2 from '../models/cmt2';
import postCmt from '../models/postCmt';

it('select', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.select(post.id, post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/select');
});

it('select, all rows', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.select();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectAll');
});

it('selectRows', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRows(post.id, post.title).orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRows');
});

it('selectRows', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRows().orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectAllRows');
});

it('selectField', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectField(post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectField');
});

it('WHERE', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .select(post.id, post.title)
      .where(mm.sql`${post.id} = ${mm.input(post.id)}`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/where');
});

it('selectRows with WHERE', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.id, post.title)
      .where(mm.sql`${post.id} = ${mm.input(post.id)}`)
      .orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsWhere');
});

it('selectRows, WHERE, orderBy', async () => {
  const cc = mm.sel(mm.sql`RAND()`, 'n', new mm.ColumnType(mm.dt.int));
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.id, cc, post.title)
      .where(mm.sql`${post.id} = ${post.id.toInput()} ${post.id.toInput()}`)
      .orderByAsc(post.title)
      .orderByAsc(cc)
      .orderByDesc(post.title)
      .orderByAsc(post.cmtCount);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsWhereOrder');
});

it('selectField, WHERE', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectField(post.user_id).byID();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/whereField');
});

it('WHERE: multiple cols', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .select(post.id, post.title)
      .where(
        mm.sql`${post.id} = ${mm.input(post.id)} && ${post.title} != ${mm.input(
          post.title,
        )}`,
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/whereMultipleCols');
});

it('Custom params', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .select(post.id, post.title)
      .where(
        mm.sql`${post.id} = ${mm.input(post.id, 'id')} && raw_name = ${mm.input(
          'string',
          'name',
        )}`,
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/customParams');
});

it('Basic join', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.select(post.user_id.join(user).url_name, post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/joinBasic');
});

it('Basic join (rows)', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.user_id.join(user).url_name, post.title)
      .where(mm.sql`${post.user_id.join(user).sig}-${post.user_id}`)
      .orderByAsc(post.user_id.join(user).sig)
      .orderByDesc(post.user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/joinBasicRows');
});

it('Join implied by WHERE', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm
      .select(cmt.id)
      .where(
        cmt.target_id.join(post).user_id.join(user).url_name.isEqualToInput(),
      );
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinImpliedByWhere');
});

it('Inverse join (select from A on A.id = B.a_id)', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
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
        mm.sql`${post.title}|${post.id
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
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/inverseJoin');
});

it('Same table, multiple cols join', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.select(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/joinCols');
});

it('Join as', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm.select(
      cmt.id,
      cmt.user_id.as('a'),
      cmt.target_id.join(post).title.as('b'),
      cmt.target_id.join(post).user_id.join(user).url_name,
      cmt.target_id.join(post).user_id.join(user).url_name.as('c'),
    );
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinAs');
});

it('Join as (attr should not affect other things)', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm.select(
      cmt.id.attrs({ foo: true }),
      cmt.user_id.as('a').attrs({ foo: true }),
      cmt.target_id.join(post).title.as('b').attrs({ foo: true }),
      cmt.target_id.join(post).user_id.join(user).url_name.attrs({ foo: true }),
      cmt.target_id
        .join(post)
        .user_id.join(user)
        .url_name.as('c')
        .attrs({ foo: true }),
    );
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinAs');
});

it('Join and from', async () => {
  const jCmt = postCmt.cmt_id.join(cmt2);
  class CmtTA extends mm.TableActions {
    selectT = mm
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
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinAndFrom');
});

it('Selected name collisions', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.select(
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
  const ta = mm.tableActions(post, PostTA);
  await itRejects(
    testBuildAsync(ta, ''),
    'The selected column name "title" already exists [action "selectT"]',
  );
});

it('Raw columns', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.select(
      // User specified types
      new mm.RawColumn(mm.sql`raw expr`, 'a', new mm.ColumnType(mm.dt.bigInt)),
      new mm.RawColumn(
        mm.sql`xyz(${post.n_date})`,
        'b',
        new mm.ColumnType(mm.dt.smallInt),
      ),
      new mm.RawColumn(
        mm.sql`xyz(${post.user_id.join(user).display_name})`,
        'c',
        new mm.ColumnType(mm.dt.int),
      ),
      // Auto detected types
      new mm.RawColumn(post.user_id.join(user).display_name, 'snake_name'),
      new mm.RawColumn(mm.sql`${mm.count(post.n_datetime)}`),
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/rawColumn');
});

it('Custom DB names', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.select(
      post.cmtCount, // cmtCount is set to cmt_c in models via `setDBName`
      post.m_user_id,
      post.m_user_id.as('a'),
      post.m_user_id.join(user).follower_count,
      post.m_user_id.join(user).follower_count.as('fc'),
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/modifiedDBNames');
});

it('selectRows, paginate', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRows(post.id, post.title).paginate().orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsPaginate');
});

it('selectRows, LIMIT and OFFSET', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.id, post.title)
      .orderByAsc(post.id)
      .limit(10)
      .offset(new mm.SQLVariable(mm.int(), 'offsetVar'));
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsLimitOffset');
});

it('selectRows, paginate, where', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.id, post.title)
      .byID()
      .paginate()
      .orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsPaginateWithWhere');
});

it('selectPage', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectPage(post.id, post.title).byID().orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectPage');
});

it('WHERE, inputs, joins', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm
      .select(cmt.id)
      .where(
        mm.sql` ${cmt.id.toInput()}, ${cmt.user_id.toInput()}, ${cmt.target_id
          .join(post)
          .title.toInput()}, ${cmt.target_id
          .join(post)
          .user_id.join(user)
          .url_name.toInput()}`,
      );
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/whereInputsJoins');
});

it('Argument stubs', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .select(post.id, post.title)
      .argStubs(
        new mm.SQLVariable('int', 'id1'),
        new mm.SQLVariable('int', 'id2'),
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/argStubs');
});

it('GROUP BY and HAVING', async () => {
  const yearCol = mm.sel(mm.sql`${mm.year(post.datetime)}`, 'year');
  class PostTA extends mm.TableActions {
    t = mm
      .select(yearCol, mm.sel(mm.sql`${mm.sum(post.cmtCount)}`, 'total'))
      .byID()
      .groupBy(yearCol, 'total')
      .having(
        mm.and(
          mm.sql`${yearCol} > ${yearCol.toInput()}`,
          mm.sql`\`total\` > ${mm.int().toInput('total')}`,
        ),
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/groupByAndHaving');
});

it('snake_case keys', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.select(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/snakeCaseKeys', {
    noFileHeader: true,
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.snakeCase },
  });
});

it('camelCase keys', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.select(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/camelCaseKeys', {
    noFileHeader: true,
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Ignored keys', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.select(
      rpl.user_id
        .join(user)
        .url_name.attrs({ [mm.ColumnAttributes.isPrivate]: true }),
      rpl.user_id
        .join(user)
        .id.attrs({ [mm.ColumnAttributes.isPrivate]: true }),
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/ignoredKeys', {
    noFileHeader: true,
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Ignored keys (raw columns)', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.select(
      mm.sel(mm.sql`1`, 'a', mm.int().__type),
      mm
        .sel(mm.sql`1`, 'b', mm.int().__type)
        .attrs({ [mm.ColumnAttributes.isPrivate]: true }),
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/ignoredKeysRawCols', {
    noFileHeader: true,
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Exclude empty properties', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.select(
      rpl.user_id.join(user).url_name.attrs({
        [mm.ColumnAttributes.isPrivate]: true,
        [mm.ColumnAttributes.excludeEmptyValue]: true,
      }),
      rpl.user_id.join(user).id.attrs({
        [mm.ColumnAttributes.excludeEmptyValue]: true,
      }),
      rpl.to_user_id.join(user).url_name.attrs({
        [mm.ColumnAttributes.excludeEmptyValue]: true,
      }),
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/excludedEmptyProps', {
    noFileHeader: true,
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Exclude all empty properties', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.select(
      rpl.user_id.join(user).url_name.attrs({
        [mm.ColumnAttributes.isPrivate]: true,
      }),
      rpl.user_id.join(user).id.attrs({
        [mm.ColumnAttributes.excludeEmptyValue]: true,
      }),
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/excludedEmptyProps', {
    noFileHeader: true,
    jsonEncoding: {
      encodingStyle: mr.JSONEncodingStyle.camelCase,
      excludeEmptyValues: true,
    },
  });
});

it('SELECT, EXISTS, IF', async () => {
  class PostTA extends mm.TableActions {
    t1 = mm.select(
      mm.sel(mm.exists(mm.select(post.user_id.join(user).sig).byID()), 'a'),
    );
    t2 = mm.select(
      mm.sel(
        mm
          .IF(
            mm.exists(mm.select(post.user_id.join(user).sig).byID()),
            '1',
            '2',
          )
          .setReturnType(mm.int().__type),
        'a',
      ),
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectExistsIf');
});
