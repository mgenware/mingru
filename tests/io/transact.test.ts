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

  t1 = dd.transact(wrapSelf.s, wrapSelf.d, this.standard);
}
const wrapOther = dd.ta(post, WrapOtherTA);

test('TransactIO', () => {
  const io = mr.transactIO(wrapOther.t1, dialect);
  expect(io).toBeInstanceOf(mr.TransactIO);
});

test('getInputs', () => {
  const io = mr.transactIO(wrapOther.t1, dialect);
  expect(io.funcArgs.toString()).toEqual(
    'urlName: string, id: uint64, urlName: string, sig: *string, followerCount: *string, urlName: string, id: uint64, urlName: string, followerCount: *string, urlName: string, urlName: string, sig: *string, followerCount: *string {urlName: string, id: uint64, sig: *string, followerCount: *string}',
  );
  // No execArgs in TX actions
  expect(io.execArgs.toString()).toEqual('');
});
