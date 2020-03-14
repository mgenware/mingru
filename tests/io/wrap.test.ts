import * as mr from '../../';
import * as mm from 'mingru-models';
import user from '../models/user';
import post from '../models/post';
import { WrapIO } from '../../';
import * as assert from 'assert';
import { itThrows } from 'it-throws';

const expect = assert.equal;
const dialect = mr.mysql;

class WrapSelfTA extends mm.TableActions {
  s = mm
    .updateSome()
    .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
    .setInputs(user.sig, user.follower_count)
    .where(
      mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`,
    );
  d = this.s.wrap({ sig: '"haha"' });
  dTmp = mm
    .updateSome()
    .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
    .setInputs(user.sig, user.follower_count)
    .where(
      mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`,
    )
    .wrap({ sig: '"haha"' });
}
const wrapSelf = mm.tableActions(user, WrapSelfTA);

class WrapOtherTA extends mm.TableActions {
  standard = wrapSelf.s.wrap({ id: '123' });
  nested = wrapSelf.d.wrap({ id: '123' });
  retValue = wrapSelf.d.wrap({ id: new mm.ValueRef('extID') });
}
const wrapOther = mm.tableActions(post, WrapOtherTA);

it('WrapIO', () => {
  const wrappedIO = mr.wrapIO(wrapSelf.d, dialect);
  assert.ok(wrappedIO instanceof mr.WrapIO);

  // tmp inner action results in tmp inner IO gets updated in-place with
  // wrap IO created.
  const innerIO = mr.wrapIO(wrapSelf.dTmp, dialect);
  assert.ok(innerIO instanceof mr.UpdateIO);
});

it('getInputs (wrapSelf and innerIO)', () => {
  const io = mr.wrapIO(wrapSelf.d, dialect) as WrapIO;
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, urlName: string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, followerCount: *string}',
  );
  expect(
    io.execArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, sig: *string="haha", followerCount: *string',
  );
  expect(io.funcPath, 'da.S');
});

it('getInputs (wrapOther)', () => {
  const io = mr.wrapIO(wrapOther.standard, dialect) as WrapIO;
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, urlName: string, sig: *string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, sig: *string, followerCount: *string}',
  );
  expect(
    io.execArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64=123, sig: *string, followerCount: *string',
  );
  expect(io.funcPath, 'User.S');
});

it('getInputs (wrapOther, nested)', () => {
  const io = mr.wrapIO(wrapOther.nested, dialect) as WrapIO;
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, urlName: string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, followerCount: *string}',
  );
  expect(
    io.execArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64=123, followerCount: *string',
  );
  expect(io.funcPath, 'User.D');
});

it('Throws on undefined inputs', () => {
  class UserTA extends mm.TableActions {
    t = mm
      .select(user.id, user.url_name)
      .where(
        mm.sql`${user.id.toInput()} ${user.url_name.toInput()} ${user.id.toInput()}`,
      );
    t2 = this.t.wrap({
      haha: `"tony"`,
    });
  }
  const ta = mm.tableActions(user, UserTA);
  const v = ta.t2;
  itThrows(
    () => mr.wrapIO(v, dialect),
    `The argument "haha" doesn't exist in action "t2", available keys "queryable, id, urlName"`,
  );
});

it('ReturnRef', () => {
  const io = mr.wrapIO(wrapOther.retValue, dialect) as WrapIO;
  expect(
    io.funcArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64=ValueRef(extID), urlName: string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64=ValueRef(extID), followerCount: *string}',
  );
  expect(
    io.execArgs.toString(),
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, followerCount: *string',
  );
  expect(io.funcPath, 'User.D');
});
