import * as mr from '../../';
import * as dd from 'dd-models';
import user from '../models/user';

const dialect = new mr.MySQL();

class WrapSelfTA extends dd.TA {
  s = dd
    .updateSome()
    .set(user.url_name, dd.sql`${dd.input(user.url_name)}`)
    .setInputs(user.sig)
    .set(user.follower_count, dd.sql`${user.follower_count} + 1`)
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

test('getInputs', () => {
  const io = mr.wrapIO(wrapSelf.d, dialect);
  expect(io.funcArgs.toString()).toEqual(
    'urlName: string, id: uint64, urlName: string {urlName: string, id: uint64}',
  );
  expect(io.execArgs.toString()).toEqual(
    'urlName: string, sig: *string="haha", urlName: string, id: uint64, urlName: string {urlName: string, sig: *string="haha", id: uint64}',
  );
});
