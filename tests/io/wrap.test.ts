import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';

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

test('WrapIO', () => {
  const io = mr.wrapIO(wrapSelf.d, dialect);
  expect(io).toBeInstanceOf(mr.WrapIO);
});

test('getInputs (wrapSelf and innerIO)', () => {
  const io = mr.wrapIO(wrapSelf.d, dialect);
  expect(io.funcArgs.toString()).toEqual(
    'urlName: string, id: uint64, urlName: string, followerCount: *string {urlName: string, id: uint64, followerCount: *string}',
  );
  expect(io.innerIO.funcArgs.toString()).toEqual(
    'urlName: string, id: uint64, urlName: string, sig: *string, followerCount: *string {urlName: string, id: uint64, sig: *string, followerCount: *string}',
  );
  expect(io.execArgs.toString()).toEqual(
    'urlName: string, sig: *string="haha", followerCount: *string, urlName: string, id: uint64, urlName: string {urlName: string, sig: *string="haha", followerCount: *string, id: uint64}',
  );
  expect(io.innerIO.execArgs.toString()).toEqual(
    'urlName: string, sig: *string, followerCount: *string, urlName: string, id: uint64, urlName: string {urlName: string, sig: *string, followerCount: *string, id: uint64}',
  );
});
