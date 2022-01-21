/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as mm from 'mingru-models';
import * as mr from '../../dist/main.js';
import user from '../models/user.js';
import post from '../models/post.js';
import { commonIOOptions } from './common.js';
import { eq, ok } from '../assert-aliases.js';

it('TransactIO', () => {
  class WrapSelfTA extends mm.TableActions {
    s = mm
      .updateSome()
      .set(user.url_name, mm.sql`${mm.input(user.url_name)}`)
      .setInputs(user.sig, user.follower_count)
      .whereSQL(mm.sql`${user.url_name.toInput()} ${user.id.toInput()} ${user.url_name.toInput()}`);

    d = this.s.wrap({ sig: '"haha"' });
  }
  const wrapSelf = mm.tableActions(user, WrapSelfTA);

  class WrapOtherTA extends mm.TableActions {
    standard = wrapSelf.s.wrap({ id: '123' });
    nested = wrapSelf.d.wrap({ id: '123' });
    t1 = mm.transact(wrapSelf.s, wrapSelf.d, this.standard);
  }
  const wrapOther = mm.tableActions(post, WrapOtherTA);
  const io = mr.transactIO(wrapOther.t1, commonIOOptions);
  ok(io instanceof mr.TransactIO);
  eq(
    io.funcArgs.toString(),
    'db: *sql.DB|database/sql, urlName: string, id: uint64, urlName: string, sig: *string, followerCount: *string, urlName: string, id: uint64, urlName: string, followerCount: *string, urlName: string, urlName: string, sig: *string, followerCount: *string {db: *sql.DB|database/sql, urlName: string, id: uint64, sig: *string, followerCount: *string}',
  );
  // No execArgs in TX actions
  eq(io.execArgs.toString(), '');
});

it('Members with WRAP actions', () => {
  class SourceTA extends mm.TableActions {
    s = mm.updateSome().setInputs(user.sig, user.follower_count).by(user.id);
  }
  const srcTA = mm.tableActions(user, SourceTA);
  class WrapTA extends mm.TableActions {
    s = mm.updateSome().setInputs(user.sig, user.follower_count).by(user.id);
    s2 = this.s.wrap({ sig: '"haha"' });
    t = mm.transact(this.s.wrap({ sig: '"haha"' }));
    t2 = mm.transact(this.s2);
    t3 = mm.transact(this.s);
    t4 = mm.transact(srcTA.s);
  }
  const wrapTA = mm.tableActions(user, WrapTA);

  const io = mr.transactIO(wrapTA.t, commonIOOptions);
  ok(io instanceof mr.TransactIO);
  eq(io.funcArgs.toString(), 'db: *sql.DB|database/sql, id: uint64, followerCount: *string');
  // No execArgs in TX actions
  eq(io.execArgs.toString(), '');

  const m1 = io.memberIOs[0]!.actionIO;
  eq(
    m1.funcArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, id: uint64, followerCount: *string',
  );
  eq(
    m1.execArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, id: uint64, sig: *string="haha", followerCount: *string',
  );

  const io2 = mr.transactIO(wrapTA.t2, commonIOOptions);
  ok(io2 instanceof mr.TransactIO);
  eq(io2.funcArgs.toString(), 'db: *sql.DB|database/sql, id: uint64, followerCount: *string');
  // No execArgs in TX actions
  eq(io2.execArgs.toString(), '');

  const m2 = io2.memberIOs[0]!.actionIO;
  eq(
    m2.funcArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, id: uint64, followerCount: *string',
  );
  eq(
    m2.execArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, id: uint64, sig: *string="haha", followerCount: *string',
  );

  const io3 = mr.transactIO(wrapTA.t3, commonIOOptions);
  ok(io3 instanceof mr.TransactIO);
  eq(
    io3.funcArgs.toString(),
    'db: *sql.DB|database/sql, id: uint64, sig: *string, followerCount: *string',
  );
  // No execArgs in TX actions
  eq(io3.execArgs.toString(), '');

  const m3 = io3.memberIOs[0]!.actionIO;
  eq(
    m3.funcArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, id: uint64, sig: *string, followerCount: *string',
  );
  eq(m3.execArgs.toString(), 'sig: *string, followerCount: *string, id: uint64');

  const io4 = mr.transactIO(wrapTA.t4, commonIOOptions);
  ok(io4 instanceof mr.TransactIO);
  eq(
    io4.funcArgs.toString(),
    'db: *sql.DB|database/sql, id: uint64, sig: *string, followerCount: *string',
  );
  // No execArgs in TX actions
  eq(io4.execArgs.toString(), '');

  const m4 = io4.memberIOs[0]!.actionIO;
  eq(
    m4.funcArgs.toString(),
    'queryable: mingru.Queryable|github.com/mgenware/mingru-go-lib, id: uint64, sig: *string, followerCount: *string',
  );
  eq(m4.execArgs.toString(), 'sig: *string, followerCount: *string, id: uint64');
});

it('TX member IOs', () => {
  class Employee extends mm.Table {
    id = mm.pk(mm.int()).autoIncrement.setDBName('emp_no');
    firstName = mm.varChar(50);
  }
  const employee = mm.table(Employee, 'employees');
  class EmployeeTA extends mm.TableActions {
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
  const employeeTA = mm.tableActions(employee, EmployeeTA);
  const io = mr.transactIO(employeeTA.insert2, commonIOOptions);
  const members = io.memberIOs;
  eq(
    members[0]!.toString(),
    'TransactMemberIO(InsertAction(insert, Table(employee|employees)), mrTable.Insert)',
  );
  eq(
    members[1]!.toString(),
    'TransactMemberIO(InsertAction(insert, Table(employee|employees)), mrTable.Insert)',
  );
  eq(members[0]!.actionIO.returnValues.toString(), '__insertedID: uint64');
  eq(members[1]!.actionIO.returnValues.toString(), '__insertedID: uint64');
});
