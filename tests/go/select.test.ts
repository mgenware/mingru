import * as mm from 'mingru-models';
import { itRejects } from 'it-throws';
import * as mr from '../../dist/main.js';
import post from '../models/post.js';
import cmt from '../models/cmt.js';
import rpl from '../models/postReply.js';
import user from '../models/user.js';
import { testBuildAsync } from './common.js';
import postCategory from '../models/postCategory.js';
import category from '../models/category.js';
import cmt2 from '../models/cmt2.js';
import postCmt from '../models/postCmt.js';

it('select', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(post.id, post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/select');
});

it('select *', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow();
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

it('selectFieldRows', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectFieldRows(post.title).orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectFieldRows');
});

it('selectFieldRows + nullable', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectFieldRows(post.n_datetime).orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectFieldRowsNullable');
});

it('selectAllRows', async () => {
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

it('selectField + nullable', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectField(post.n_datetime);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectFieldNullable');
});

it('WHERE', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(post.id, post.title).whereSQL(mm.sql`${post.id} = ${mm.input(post.id)}`);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/where');
});

it('selectRows with WHERE', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRows(post.id, post.title).where`${post.id.isEqualToInput()}`.orderByAsc(
      post.id,
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsWhere');
});

it('selectRows, WHERE, orderBy', async () => {
  const cc = mm.sel(mm.sql`RAND()`, 'n', new mm.ColumnType(mm.dt.int));
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.id, cc, post.title)
      .whereSQL(mm.sql`${post.id} = ${post.id.toInput()}`)
      .orderByAsc(post.title)
      .orderByAsc(cc)
      .orderByDesc(post.title)
      .orderByAsc(post.cmtCount);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsWhereOrder');
});

it('ORDER BY inputs', async () => {
  const cc = mm.sel(mm.sql`RAND()`, 'n', new mm.ColumnType(mm.dt.int));
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.id, cc, post.title)
      .whereSQL(mm.sql`${post.id} = ${post.id.toInput()}`)
      .orderByAsc(post.title)
      .orderByInput(cc, post.title, post.cmtCount)
      .orderByInput('n', post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/orderByInputs');
});

it('selectField, WHERE', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectField(post.user_id).by(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/whereField');
});

it('WHERE: multiple cols', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRow(post.id, post.title)
      .whereSQL(
        mm.sql`${post.id} = ${mm.input(post.id)} && ${post.title} != ${mm.input(post.title)}`,
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/whereMultipleCols');
});

it('Custom params', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRow(post.id, post.title)
      .whereSQL(
        mm.sql`${post.id} = ${mm.input(post.id, 'id')} && raw_name = ${mm.input(
          { type: 'string', defaultValue: 0 },
          'name',
        )}`,
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/customParams');
});

it('Basic join', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(post.user_id.join(user).url_name, post.title);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/joinBasic');
});

it('Basic join (rows)', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.user_id.join(user).url_name, post.title)
      .whereSQL(mm.sql`${post.user_id.join(user).sig}-${post.user_id}`)
      .orderByAsc(post.user_id.join(user).sig)
      .orderByDesc(post.user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/joinBasicRows');
});

it('Join implied by WHERE', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm
      .selectRow(cmt.id)
      .whereSQL(cmt.target_id.join(post).user_id.join(user).url_name.isEqualToInput());
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinImpliedByWhere');
});

it('Inverse join (select from A on A.id = B.a_id)', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(
        post.title,
        post.id.join(postCategory, postCategory.post_id).category_id.setModelName('category_id'),
        post.id
          .join(postCategory, postCategory.post_id)
          .category_id.join(category)
          .id.setModelName('id'),
      )
      .whereSQL(
        mm.sql`${post.title}|${post.id
          .join(postCategory, postCategory.post_id)
          .category_id.setModelName('category_id')}|${post.id
          .join(postCategory, postCategory.post_id)
          .category_id.join(category)
          .id.setModelName('id')}`,
      )
      .orderByAsc(post.id.join(postCategory, postCategory.post_id).category_id.join(category).id)
      .orderByDesc(post.user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/inverseJoin');
});

it('Same table, multiple cols join', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.selectRow(
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
    selectT = mm.selectRow(
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
    selectT = mm.selectRow(
      cmt.id.attr(101, true),
      cmt.user_id.as('a').attr(101, true),
      cmt.target_id.join(post).title.as('b').attr(101, true),
      cmt.target_id.join(post).user_id.join(user).url_name.attr(101, true),
      cmt.target_id.join(post).user_id.join(user).url_name.as('c').attr(101, true),
    );
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/joinAs');
});

it('Explicit join', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(post.title.join(user, user.url_name).age);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/explicitJoin');
});

it('Explicit join with multiple columns', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(
      post.title.join(user, user.url_name, [
        [post.user_id, user.id],
        [post.m_user_id, user.id],
      ]).age,
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/explicitJoinMultiCols');
});

it('Explicit join with multiple columns and an extra SQL', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(
      post.title.join(
        user,
        user.url_name,
        [[post.m_user_id, user.id]],
        (jt) => mm.sql`AND ${jt.age.isEqualToInput()} AND ${post.id.isEqualToInput()}`,
      ).age,
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/explicitJoinMultiColsExtraSQL');
});

it('Join and from', async () => {
  const jCmt = postCmt.cmt_id.join(cmt2);
  class CmtTA extends mm.TableActions {
    selectT = mm
      .selectRow(
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
    selectT = mm.selectRow(
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
    'The selected column name "title" already exists [action "post.selectT"]',
  );
});

it('Raw columns', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(
      // User specified types
      new mm.RawColumn(mm.sql`raw expr`, 'a', new mm.ColumnType(mm.dt.bigInt)),
      new mm.RawColumn(mm.sql`xyz(${post.n_date})`, 'b', new mm.ColumnType(mm.dt.smallInt)),
      new mm.RawColumn(
        mm.sql`xyz(${post.user_id.join(user).display_name})`,
        'c',
        new mm.ColumnType(mm.dt.int),
      ),
      // Auto detected types
      new mm.RawColumn(post.user_id.join(user).display_name, 'snake_name'),
      new mm.RawColumn(mm.sql`${mm.count(post.n_datetime)}`, 'nDatetime'),
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/rawColumn');
});

it('Custom DB names', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRow(
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

it('selectRows, paginate, WHERE', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRows(post.id, post.title).by(post.id).paginate().orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectRowsPaginateWithWhere');
});

it('Select rows, page mode', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectRows(post.id, post.title).by(post.id).pageMode().orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectPage');
});

it('Select fields, page mode', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm.selectFieldRows(post.n_datetime).by(post.id).pageMode().orderByAsc(post.id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectFieldRowsPage');
});

it('WHERE, inputs, joins', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm
      .selectRow(cmt.id)
      .whereSQL(
        mm.sql` ${cmt.id.toInput()}, ${cmt.user_id.toInput()}, ${cmt.target_id
          .join(post)
          .title.toInput()}, ${cmt.target_id.join(post).user_id.join(user).url_name.toInput()}`,
      );
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/whereInputsJoins');
});

it('Column aliases', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm
      .selectRow(
        cmt.votes,
        cmt.votes.as('user_votes'),
        cmt.votes.join(post).time,
        cmt.votes.join(post).time.as('alias_in_join'),
        cmt.votes.join(post).time.as('PascalCaseAlias'),
      )
      .whereSQL(
        mm.sql`${cmt.votes.join(post).reviewer_id} ${cmt.target_id
          .join(post)
          .user_id.join(user)
          .url_name.toInput()}`,
      )
      .groupBy(cmt.votes).having`${cmt.votes} ${cmt.votes.join(post).time}`
      .orderByAsc(cmt.votes)
      .orderByDesc(cmt.votes.join(post).time)
      .orderByDesc(cmt.votes.join(post).time.as('alias_in_join'));
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/aliases');
});

it('No column aliases', async () => {
  class CmtTA extends mm.TableActions {
    selectT = mm
      .selectRow(
        cmt.votes,
        cmt.votes.as('user_votes'),
        cmt.votes.join(post).time,
        cmt.votes.join(post).time.as('alias_in_join'),
        cmt.votes.join(post).time.as('PascalCaseAlias'),
      )
      .whereSQL(
        mm.sql`${cmt.votes.join(post).reviewer_id} ${cmt.target_id
          .join(post)
          .user_id.join(user)
          .url_name.toInput()}`,
      )
      .groupBy(cmt.votes).having`${cmt.votes} ${cmt.votes.join(post).time}`
      .orderByAsc(cmt.votes)
      .orderByDesc(cmt.votes.join(post).time)
      .orderByDesc(cmt.votes.join(post).time.as('alias_in_join'));
  }
  const ta = mm.tableActions(cmt, CmtTA);
  await testBuildAsync(ta, 'select/noAliases');
});

it('Argument stubs', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRow(post.id, post.title)
      .argStubs(
        new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id1'),
        new mm.SQLVariable({ type: 'int', defaultValue: 0 }, 'id2'),
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/argStubs');
});

it('GROUP BY and HAVING', async () => {
  const yearCol = mm.sel(mm.sql`${mm.year(post.datetime)}`, 'year');
  class PostTA extends mm.TableActions {
    t = mm
      .selectRow(yearCol, mm.sel(mm.sql`${mm.sum(post.cmtCount)}`, 'total'))
      .by(post.id)
      .groupBy(yearCol, 'total')
      .havingSQL(
        mm.and(
          mm.sql`${yearCol} > ${mm.input(mm.int(), 'year')}`,
          mm.sql`\`total\` > ${mm.int().toInput('total')}`,
        ),
      );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/groupByAndHaving');
});

it('HAVING and JOIN', async () => {
  class PostTA extends mm.TableActions {
    t = mm.selectRows(post.n_time).groupBy(post.title).having`${post.user_id
      .join(user)
      .id.isEqualToInput()}`.orderByAsc(post.user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/groupByAndHavingJoin');
});

it('snake_case keys', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.selectRow(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/snakeCaseKeys', {
    goFileHeader: '',
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.snakeCase },
  });
});

it('camelCase keys', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.selectRow(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/camelCaseKeys', {
    goFileHeader: '',
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Private columns', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.selectRow(
      rpl.user_id.join(user).url_name.attr(mm.ColumnAttribute.isPrivate, true),
      rpl.user_id.join(user).id.privateAttr(),
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/ignoredKeys', {
    goFileHeader: '',
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Private columns (raw columns)', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.selectRow(
      mm.sel(mm.sql`1`, 'a', mm.int().__type()),
      mm.sel(mm.sql`1`, 'b', mm.int().__type()).privateAttr(),
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/ignoredKeysRawCols', {
    goFileHeader: '',
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Forced public columns', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm
      .selectRow(
        rpl.user_id.join(user).url_name.attr(mm.ColumnAttribute.isPrivate, true),
        rpl.user_id.join(user).id.privateAttr(),
        rpl.to_user_id.join(user).url_name,
      )
      .attr(mm.ActionAttribute.ignorePrivateColumns, true);
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/forcedPublicColumns', {
    goFileHeader: '',
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase, excludeEmptyValues: true },
  });
});

it('Exclude empty properties', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.selectRow(
      rpl.user_id
        .join(user)
        .url_name.attr(mm.ColumnAttribute.excludeEmptyValue, true)
        .privateAttr(),
      rpl.user_id.join(user).id.attr(mm.ColumnAttribute.excludeEmptyValue, true),
      rpl.to_user_id.join(user).url_name.attr(mm.ColumnAttribute.excludeEmptyValue, true),
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/excludedEmptyProps', {
    goFileHeader: '',
    jsonEncoding: { encodingStyle: mr.JSONEncodingStyle.camelCase },
  });
});

it('Exclude all empty properties', async () => {
  class RplTA extends mm.TableActions {
    selectT = mm.selectRow(
      rpl.user_id.join(user).url_name.attr(mm.ColumnAttribute.isPrivate, true),
      rpl.user_id.join(user).id.attr(mm.ColumnAttribute.excludeEmptyValue, true),
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = mm.tableActions(rpl, RplTA);
  await testBuildAsync(ta, 'select/excludedEmptyProps', {
    goFileHeader: '',
    jsonEncoding: {
      encodingStyle: mr.JSONEncodingStyle.camelCase,
      excludeEmptyValues: true,
    },
  });
});

it('SELECT, EXISTS, IF', async () => {
  class PostTA extends mm.TableActions {
    t1 = mm.selectRow(
      mm.sel(mm.exists(mm.selectRow(post.user_id.join(user).sig).by(post.id)), 'a'),
    );

    t2 = mm.selectRow(
      mm.sel(
        mm
          .IF(mm.exists(mm.selectRow(post.user_id.join(user).sig).by(post.id)), '1', '2')
          .setReturnType(mm.int().__type()),
        'a',
      ),
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectExistsIf');
});

it('selectExists', async () => {
  class PostTA extends mm.TableActions {
    t = mm.selectExists().whereSQL(post.user_id.join(user).sig.isEqualToInput());
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/selectExists');
});

it('toInputArray', async () => {
  class PostTA extends mm.TableActions {
    t = mm.selectRows(post.id, post.title).where`${post.id} IN ${post.id.toArrayInput(
      'ids',
    )} OR ${post.id.isNotEqualToInput('idInput')} OR ${post.id.isInArrayInput()}`.orderByAsc(
      post.id,
    );
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/toInputArray');
});

it('Inputs', async () => {
  class PostTA extends mm.TableActions {
    t = mm.selectRow(post.id).where`${post.n_datetime.toInput()} ${post.n_datetime.toInput('p2', {
      nullable: false,
    })} ${post.n_datetime.toInput('p3', {
      nullable: true,
    })} ${post.id.toInput('p4', { nullable: false })} ${post.id.toInput('p5', { nullable: true })}`;
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/inputs');
});

it('Inputs with array', async () => {
  class PostTA extends mm.TableActions {
    t = mm.selectRow(post.id).where`${post.n_datetime.toInput(undefined, {
      isArray: true,
    })} ${post.n_datetime.toInput('p2', {
      nullable: false,
    })} ${post.n_datetime.toInput('p3', {
      nullable: true,
    })} ${post.id.toInput('p4', { nullable: false })} ${post.id.toInput('p5', { nullable: true })}`;
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/inputsArrayVersion');
});

it('Nested AS in SQL calls', async () => {
  // The AS in selected columns should jump out of nested SQL calls,
  // e.g. SELECT FUNC(FUNC(`col`)) AS `name1`.
  class PostTA extends mm.TableActions {
    t = mm.selectRow(mm.sel(mm.year(mm.year(post.id)), 'name1')).where`${mm.year(
      mm.year(post.id),
    )} == ${post.id.toInput('idInput')}`;
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/nestedAsInCalls');
});

it('Nested AS in SQL calls (with join)', async () => {
  // The AS in selected columns should jump out of nested SQL calls,
  // e.g. SELECT FUNC(FUNC(`col`)) AS `name1`.
  const col = post.user_id.join(user).age;
  class PostTA extends mm.TableActions {
    t = mm.selectRow(mm.sel(mm.year(mm.year(col)), 'name1')).where`${mm.year(
      mm.year(col),
    )} == ${col.toInput('ageInput')}`;
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/nestedAsInCallsWithJoin');
});

it('column.setModelName', async () => {
  class MyTable extends mm.Table {
    my_id = mm.pk();
    my_name = mm.varChar(100).setModelName('my___name');
  }
  const myTable = mm.table(MyTable);
  class MyTableTA extends mm.TableActions {
    selectT = mm.selectRows().orderByAsc(post.id);
  }
  const ta = mm.tableActions(myTable, MyTableTA);
  await testBuildAsync(ta, 'select/columnModelName');
});

it('ORDER BY columns use aliases (with joins)', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.title, post.user_id.join(user).age, post.m_user_id.join(user).age)
      .orderByAsc(post.title)
      .orderByAsc(post.user_id.join(user).age)
      .orderByAsc(post.m_user_id.join(user).age);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/orderByColsAliases');
});

it('ORDER BY columns use aliases (without joins)', async () => {
  class PostTA extends mm.TableActions {
    selectT = mm
      .selectRows(post.title, post.user_id)
      .orderByAsc(post.title)
      .orderByAsc(post.user_id)
      .orderByAsc(post.m_user_id);
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/orderByColsAliasesNoJoins');
});

it('Left join', async () => {
  class PostTA extends mm.TableActions {
    row = mm.selectRow(post.user_id.leftJoin(user).url_name, post.id).by(post.id);
    rows = mm.selectRows(post.user_id.leftJoin(user).url_name, post.id).noOrderBy();
    field = mm.selectField(post.user_id.leftJoin(user).url_name);
    fieldRows = mm.selectFieldRows(post.user_id.leftJoin(user).url_name).noOrderBy();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/leftJoin');
});

it('Right join', async () => {
  class PostTA extends mm.TableActions {
    row = mm.selectRow(post.user_id.rightJoin(user).url_name, post.id).by(post.id);
    rows = mm.selectRows(post.user_id.rightJoin(user).url_name, post.id).noOrderBy();
    field = mm.selectField(post.user_id.rightJoin(user).url_name);
    fieldRows = mm.selectFieldRows(post.user_id.rightJoin(user).url_name).noOrderBy();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/rightJoin');
});

it('Full join', async () => {
  class PostTA extends mm.TableActions {
    row = mm.selectRow(post.user_id.fullJoin(user).url_name, post.id).by(post.id);
    rows = mm.selectRows(post.user_id.fullJoin(user).url_name, post.id).noOrderBy();
    field = mm.selectField(post.user_id.fullJoin(user).url_name);
    fieldRows = mm.selectFieldRows(post.user_id.fullJoin(user).url_name).noOrderBy();
  }
  const ta = mm.tableActions(post, PostTA);
  await testBuildAsync(ta, 'select/fullJoin');
});
