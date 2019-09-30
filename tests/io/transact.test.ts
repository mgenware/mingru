import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';
import * as assert from 'assert';

const expect = assert.equal;
const dialect = mr.mysql;

it('TransactIO', () => {
  class WrapSelfTA extends dd.TA {
    s = dd
      .updateSome()
      .set(user.url_name, dd.sql`${dd.input(user.url_name)}`)
      .setInputs(user.sig, user.follower_count)
      .where(
        dd.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`,
      );
    d = this.s.wrap({ sig: '"haha"' });
  }
  const wrapSelf = dd.ta(user, WrapSelfTA);

  class WrapOtherTA extends dd.TA {
    standard = wrapSelf.s.wrap({ id: '123' });
    nested = wrapSelf.d.wrap({ id: '123' });
    t1 = dd.transact(wrapSelf.s, wrapSelf.d, this.standard);
  }
  const wrapOther = dd.ta(post, WrapOtherTA);
  const io = mr.transactIO(wrapOther.t1, dialect);
  assert.ok(io instanceof mr.TransactIO);
  expect(
    io.funcArgs.toString(),
    'db: *sql.DB|database/sql, urlName: string, id: uint64, urlName: string, sig: *string, followerCount: *string, urlName: string, id: uint64, urlName: string, followerCount: *string, urlName: string, urlName: string, sig: *string, followerCount: *string {db: *sql.DB|database/sql, urlName: string, id: uint64, sig: *string, followerCount: *string}',
  );
  // No execArgs in TX actions
  expect(io.execArgs.toString(), '');
});

it('Member details (normal action, wrapped, tmp wrapped)', () => {
  class SourceTA extends dd.TA {
    s = dd
      .updateSome()
      .setInputs(user.sig, user.follower_count)
      .byID();
  }
  const srcTA = dd.ta(user, SourceTA);
  class WrapTA extends dd.TA {
    s = dd
      .updateSome()
      .setInputs(user.sig, user.follower_count)
      .byID();
    s2 = this.s.wrap({ sig: '"haha"' });
    t = dd.transact(this.s.wrap({ sig: '"haha"' }));
    t2 = dd.transact(this.s2);
    t3 = dd.transact(this.s);
    t4 = dd.transact(srcTA.s);
  }
  const wrapTA = dd.ta(user, WrapTA);

  const io = mr.transactIO(wrapTA.t, dialect);
  assert.ok(io instanceof mr.TransactIO);
  expect(
    io.funcArgs.toString(),
    'db: *sql.DB|database/sql, id: uint64, followerCount: *string',
  );
  // No execArgs in TX actions
  expect(io.execArgs.toString(), '');

  const m1 = io.memberIOs[0].actionIO;
  expect(
    m1.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, followerCount: *string',
  );
  expect(
    m1.execArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, sig: *string="haha", followerCount: *string',
  );

  const io2 = mr.transactIO(wrapTA.t2, dialect);
  assert.ok(io2 instanceof mr.TransactIO);
  expect(
    io2.funcArgs.toString(),
    'db: *sql.DB|database/sql, id: uint64, followerCount: *string',
  );
  // No execArgs in TX actions
  expect(io2.execArgs.toString(), '');

  const m2 = io2.memberIOs[0].actionIO;
  expect(
    m2.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, followerCount: *string',
  );
  expect(
    m2.execArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, sig: *string="haha", followerCount: *string',
  );

  const io3 = mr.transactIO(wrapTA.t3, dialect);
  assert.ok(io3 instanceof mr.TransactIO);
  expect(
    io3.funcArgs.toString(),
    'db: *sql.DB|database/sql, id: uint64, sig: *string, followerCount: *string',
  );
  // No execArgs in TX actions
  expect(io3.execArgs.toString(), '');

  const m3 = io3.memberIOs[0].actionIO;
  expect(
    m3.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, sig: *string, followerCount: *string',
  );
  expect(
    m3.execArgs.toString(),
    'sig: *string, followerCount: *string, id: uint64',
  );

  const io4 = mr.transactIO(wrapTA.t4, dialect);
  assert.ok(io4 instanceof mr.TransactIO);
  expect(
    io4.funcArgs.toString(),
    'db: *sql.DB|database/sql, id: uint64, sig: *string, followerCount: *string',
  );
  // No execArgs in TX actions
  expect(io4.execArgs.toString(), '');

  const m4 = io4.memberIOs[0].actionIO;
  expect(
    m4.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, id: uint64, sig: *string, followerCount: *string',
  );
  expect(
    m4.execArgs.toString(),
    'sig: *string, followerCount: *string, id: uint64',
  );
});
