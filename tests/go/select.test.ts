import * as dd from 'dd-models';
import post from '../models/post';
import cmt from '../models/cmt';
import rpl from '../models/postReply';
import user from '../models/user';
import { testBuildAsync } from './common';

test('Select', async () => {
  class PostTA extends dd.TA {
    selectT = dd.select(post.id, post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/select');
});

test('Select all', async () => {
  class PostTA extends dd.TA {
    selectT = dd.selectAll(post.id, post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectAll');
});

test('Select field', async () => {
  class PostTA extends dd.TA {
    selectT = dd.selectField(post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectField');
});

test('Where', async () => {
  class PostTA extends dd.TA {
    selectT = dd
      .select(post.id, post.title)
      .where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/where');
});

test('Select all, where', async () => {
  class PostTA extends dd.TA {
    selectT = dd
      .selectAll(post.id, post.title)
      .where(dd.sql`${post.id} = ${dd.input(post.id)}`);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/whereAll');
});

test('Select all, where, orderBy', async () => {
  const cc = dd.sel('RAND()', 'n', new dd.ColumnType(dd.dt.int));
  class PostTA extends dd.TA {
    selectT = dd
      .selectAll(post.id, cc, post.title)
      .where(dd.sql`${post.id} = ${dd.input(post.id)}`)
      .orderBy(post.title)
      .orderBy(cc)
      .orderByDesc(post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/whereAllOrderBy');
});

test('Select field, where', async () => {
  class PostTA extends dd.TA {
    selectT = dd.selectField(post.user_id).byID();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/whereField');
});

test('Where: multiple cols', async () => {
  class PostTA extends dd.TA {
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

test('Custom params', async () => {
  class PostTA extends dd.TA {
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

test('Basic join', async () => {
  class PostTA extends dd.TA {
    selectT = dd.select(post.user_id.join(user).url_name, post.title);
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/joinBasic');
});

test('Same table, multiple cols join', async () => {
  class RplTA extends dd.TA {
    selectT = dd.select(
      rpl.user_id.join(user).url_name,
      rpl.user_id.join(user).id,
      rpl.to_user_id.join(user).url_name,
    );
  }
  const ta = dd.ta(rpl, RplTA);
  await testBuildAsync(ta, 'select/joinCols');
});

test('AS', async () => {
  class CmtTA extends dd.TA {
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

test('Selected name collisions', async () => {
  class PostTA extends dd.TA {
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
  await testBuildAsync(ta, 'select/selectedNameCollisions');
});

test('Calculated columns', async () => {
  class PostTA extends dd.TA {
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

test('Custom DB names', async () => {
  class PostTA extends dd.TA {
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

test('Select all, paginate', async () => {
  class PostTA extends dd.TA {
    selectT = dd.selectAll(post.id, post.title).paginate();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectAllPaginate');
});

test('Select all, paginate, where', async () => {
  class PostTA extends dd.TA {
    selectT = dd
      .selectAll(post.id, post.title)
      .byID()
      .paginate();
  }
  const ta = dd.ta(post, PostTA);
  await testBuildAsync(ta, 'select/selectAllPaginateWithWhere');
});
