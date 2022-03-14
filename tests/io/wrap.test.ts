import { itThrows } from 'it-throws';
import * as mm from 'mingru-models';
import * as mr from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

class WrapSelfAG extends mm.ActionGroup {
  s = mm
    .updateSome()
    .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
    .setInputs(user.sig, user.follower_count)
    .whereSQL(mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`);

  d = this.s.wrap({ sig: '"haha"' });
  dTmp = mm
    .updateSome()
    .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
    .setInputs(user.sig, user.follower_count)
    .whereSQL(mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`)
    .wrap({ sig: '"haha"' });
}
const wrapSelf = mm.actionGroup(user, WrapSelfAG);

class WrapOtherAG extends mm.ActionGroup {
  standard = wrapSelf.s.wrap({ id: '123' });
  nested = wrapSelf.d.wrap({ id: '123' });
  retValue = wrapSelf.d.wrap({ id: mm.captureVar('extID') });
}
const wrapOther = mm.actionGroup(post, WrapOtherAG);

it('WrapIO', () => {
  const wrappedIO = mr.wrapIO(wrapSelf.d, commonIOOptions);
  ok(wrappedIO instanceof mr.WrapIO);

  // Inline inner action results in merging of outer and inner IOs.
  const innerIO = mr.wrapIO(wrapSelf.dTmp, commonIOOptions);
  ok(innerIO instanceof mr.UpdateIO);
});

it('getInputs (wrapSelf and innerIO)', () => {
  const io = mr.wrapIO(wrapSelf.d, commonIOOptions) as mr.WrapIO;
  eq(io.funcArgs.toString(), 'urlName: string, id: uint64, followerCount: *string');
  eq(io.execArgs.toString(), 'urlName, id, "haha", followerCount');
  eq(io.funcPath, 'mrTable.S');
});

it('getInputs (wrapOther)', () => {
  const io = mr.wrapIO(wrapOther.standard, commonIOOptions) as mr.WrapIO;
  eq(io.funcArgs.toString(), 'urlName: string, sig: *string, followerCount: *string');
  eq(io.execArgs.toString(), 'urlName, 123, sig, followerCount');
  eq(io.funcPath, 'User.S');
});

it('getInputs (wrapOther, nested)', () => {
  const io = mr.wrapIO(wrapOther.nested, commonIOOptions) as mr.WrapIO;
  eq(io.funcArgs.toString(), 'urlName: string, followerCount: *string');
  eq(io.execArgs.toString(), 'urlName, 123, followerCount');
  eq(io.funcPath, 'User.D');
});

it('Throws on undefined inputs', () => {
  class UserAG extends mm.ActionGroup {
    t = mm
      .selectRow(user.id, user.url_name)
      .whereSQL(mm.sql`${user.id.toInput()} ${user.url_name.toInput()} ${user.id.toInput()}`);

    t2 = this.t.wrap({
      haha: '"tony"',
    });
  }
  const ta = mm.actionGroup(user, UserAG);
  const v = ta.t2;
  itThrows(
    () => mr.wrapIO(v, commonIOOptions),
    'The argument "haha" doesn\'t exist in action "SelectAction(t, t=User(user))". Available arguments: mrQueryable,id,urlName, your arguments: haha',
  );
});

it('ReturnRef', () => {
  const io = mr.wrapIO(wrapOther.retValue, commonIOOptions) as mr.WrapIO;
  eq(io.funcArgs.toString(), 'urlName: string, id: uint64, followerCount: *string');
  eq(io.execArgs.toString(), 'urlName, id, followerCount');
  eq(io.funcPath, 'User.D');
});
