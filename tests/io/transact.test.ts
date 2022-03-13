/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as mm from 'mingru-models';
import * as mr from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import postCmt from '../models/postCmt.js';
import cmt2 from '../models/cmt2.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

it('TransactIO', () => {
  class WrapSelfAG extends mm.ActionGroup {
    s = mm
      .updateSome()
      .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
      .setInputs(user.sig, user.follower_count)
      .whereSQL(mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`);

    d = this.s.wrap({ sig: '"haha"' });
  }
  const wrapSelf = mm.actionGroup(user, WrapSelfAG);

  class WrapOtherAG extends mm.ActionGroup {
    standard = wrapSelf.s.wrap({ id: '123' });
    nested = wrapSelf.d.wrap({ id: '123' });
    t1 = mm.transact(wrapSelf.s, wrapSelf.d, this.standard);
  }
  const wrapOther = mm.actionGroup(post, WrapOtherAG);
  const io = mr.transactIO(wrapOther.t1, commonIOOptions);
  ok(io instanceof mr.TransactIO);
  eq(io.funcArgs.toString(), 'urlName: string, sig: *string, followerCount: *string, id: uint64');
  // No execArgs in TX actions
  eq(io.execArgs.toString(), '');
});

it('Members with WRAP actions', () => {
  class SourceAG extends mm.ActionGroup {
    s = mm.updateSome().setInputs(user.sig, user.follower_count).by(user.id);
  }
  const srcTA = mm.actionGroup(user, SourceAG);
  class WrapAG extends mm.ActionGroup {
    s = mm.updateSome().setInputs(user.sig, user.follower_count).by(user.id);
    s2 = this.s.wrap({ sig: '"haha"' });
    t = mm.transact(this.s.wrap({ sig: '"haha"' }));
    t2 = mm.transact(this.s2);
    t3 = mm.transact(this.s);
    t4 = mm.transact(srcTA.s);
  }
  const wrapTA = mm.actionGroup(user, WrapAG);

  const io = mr.transactIO(wrapTA.t, commonIOOptions);
  ok(io instanceof mr.TransactIO);
  eq(io.funcArgs.toString(), 'followerCount: *string, id: uint64');
  // No execArgs in TX actions
  eq(io.execArgs.toString(), '');

  const m1 = io.memberIOs[0]!.actionIO;
  eq(m1.funcArgs.toString(), 'followerCount: *string, id: uint64');
  eq(m1.execArgs.toString(), '"haha", followerCount, id');

  const io2 = mr.transactIO(wrapTA.t2, commonIOOptions);
  ok(io2 instanceof mr.TransactIO);
  eq(io2.funcArgs.toString(), 'followerCount: *string, id: uint64');
  // No execArgs in TX actions
  eq(io2.execArgs.toString(), '');

  const m2 = io2.memberIOs[0]!.actionIO;
  eq(m2.funcArgs.toString(), 'followerCount: *string, id: uint64');
  eq(m2.execArgs.toString(), '"haha", followerCount, id');

  const io3 = mr.transactIO(wrapTA.t3, commonIOOptions);
  ok(io3 instanceof mr.TransactIO);
  eq(io3.funcArgs.toString(), 'sig: *string, followerCount: *string, id: uint64');
  // No execArgs in TX actions
  eq(io3.execArgs.toString(), '');

  const m3 = io3.memberIOs[0]!.actionIO;
  eq(m3.funcArgs.toString(), 'sig: *string, followerCount: *string, id: uint64');
  eq(m3.execArgs.toString(), 'sig, followerCount, id');

  const io4 = mr.transactIO(wrapTA.t4, commonIOOptions);
  ok(io4 instanceof mr.TransactIO);
  eq(io4.funcArgs.toString(), 'sig: *string, followerCount: *string, id: uint64');
  // No execArgs in TX actions
  eq(io4.execArgs.toString(), '');

  const m4 = io4.memberIOs[0]!.actionIO;
  eq(m4.funcArgs.toString(), 'sig: *string, followerCount: *string, id: uint64');
  eq(m4.execArgs.toString(), 'sig, followerCount, id');
});

it('TX member IOs', () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
  }
  const employee = mm.table(Employee, { dbName: 'employees' });
  class EmployeeAG extends mm.ActionGroup {
    insert = mm.insertOne().setInputs();
    insert2 = mm
      .transact(
        this.insert,
        this.insert.declareReturnValues({
          [mm.ReturnValues.insertedID]: 'id2',
        }),
      )
      .setReturnValues('id2');
  }
  const employeeTA = mm.actionGroup(employee, EmployeeAG);
  const io = mr.transactIO(employeeTA.insert2, commonIOOptions);
  const members = io.memberIOs;
  eq(
    members[0]!.toString(),
    'TransactMemberIO(InsertAction(insert, t=Employee(employee, db=employees)), mrTable.Insert)',
  );
  eq(
    members[1]!.toString(),
    'TransactMemberIO(InsertAction(insert, t=Employee(employee, db=employees)), mrTable.Insert)',
  );
  eq(members[0]!.actionIO.returnValues.toString(), '__insertedID: uint64');
  eq(members[1]!.actionIO.returnValues.toString(), '__insertedID: uint64');
});

it('Merging SQL vars', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.transact(
      mm.insertOne().from(cmt2).setInputs(),
      mm.insertOne().from(postCmt).setInputs(),
    );
  }
  const postTA = mm.actionGroup(post, PostAG);
  const io = mr.transactIO(postTA.t, commonIOOptions);
  const mio = io.memberIOs[0]!;
  eq(mio.toString(), 'TransactMemberIO(InsertAction(-, ft=Cmt(cmt)), mrTable.tChild1)');
  eq(io.returnValues.toString(), '');
  eq(
    io.funcArgs.toString(),
    'content: string, userID: uint64, createdAt: time.Time|time, modifiedAt: time.Time|time, rplCount: uint, postID: uint64, cmtID: uint64',
  );
  eq(io.execArgs.toString(), '');
});

it('Merging SQL vars (WRAPPED)', () => {
  class PostAG extends mm.ActionGroup {
    t = mm.transact(
      mm.insertOne().from(cmt2).setInputs(),
      mm.insertOne().from(postCmt).setInputs(),
    );

    wrapped = this.t.wrap({ rplCount: 1, cmtID: 2 });
  }
  const postTA = mm.actionGroup(post, PostAG);
  const io = mr.wrapIO(postTA.wrapped, commonIOOptions);
  eq(io.returnValues.toString(), '');
  eq(
    io.funcArgs.toString(),
    'content: string, userID: uint64, createdAt: time.Time|time, modifiedAt: time.Time|time, postID: uint64',
  );
  eq(io.execArgs.toString(), 'content, userID, createdAt, modifiedAt, 1, postID, 2');
});
