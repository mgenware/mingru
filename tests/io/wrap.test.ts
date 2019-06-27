import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';
import post from '../models/post';

const dialect = new mr.MySQL();

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
}
const wrapOther = dd.ta(post, WrapOtherTA);

test('WrapIO', () => {
  const io = mr.wrapIO(wrapSelf.d, dialect);
  expect(io).toBeInstanceOf(mr.WrapIO);
});

test('getInputs (wrapSelf and innerIO)', () => {
  const io = mr.wrapIO(wrapSelf.d, dialect);
  expect(io.funcArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, urlName: string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, followerCount: *string}',
  );
  expect(io.innerIO.funcArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, urlName: string, sig: *string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, sig: *string, followerCount: *string}',
  );
  expect(io.execArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64, sig: *string="haha", followerCount: *string',
  );
  expect(io.innerIO.execArgs.toString()).toBe(
    'urlName: string, sig: *string, followerCount: *string, urlName: string, id: uint64, urlName: string {urlName: string, sig: *string, followerCount: *string, id: uint64}',
  );
  expect(io.funcPath).toBe('da.S');
});

test('getInputs (wrapOther)', () => {
  const io = mr.wrapIO(wrapOther.standard, dialect);
  expect(io.funcArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, urlName: string, sig: *string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, sig: *string, followerCount: *string}',
  );
  expect(io.execArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64=123, sig: *string, followerCount: *string',
  );
  expect(io.funcPath).toBe('User.S');
});

test('getInputs (wrapOther, nested)', () => {
  const io = mr.wrapIO(wrapOther.nested, dialect);
  expect(io.funcArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, urlName: string, followerCount: *string {queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, followerCount: *string}',
  );
  expect(io.execArgs.toString()).toBe(
    'queryable: dbx.Queryable|github.com/mgenware/go-packagex/v5/dbx, urlName: string, id: uint64=123, followerCount: *string',
  );
  expect(io.funcPath).toBe('User.D');
});

test('Throws on undefined inputs', () => {
  class UserTA extends dd.TA {
    t = dd
      .select(user.id, user.url_name)
      .where(
        dd.sql`${user.id.toInput()} ${user.url_name.toInput()} ${user.id.toInput()}`,
      );
    t2 = this.t.wrap({
      haha: `"tony"`,
    });
  }
  const ta = dd.ta(user, UserTA);
  const v = ta.t2;
  expect(() => mr.wrapIO(v, dialect)).toThrow('haha');
});
