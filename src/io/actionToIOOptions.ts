import * as mm from 'mingru-models';
import { Dialect } from '../dialect';

export interface ActionToIOOptions {
  dialect: Dialect;

  // If true, SELECT processors skip result type generation.
  // Used in UNIONs and subqueries.
  selectionLiteMode?: boolean;

  // Indicates a UNION member that is not the first child.
  // UNION member ORDER BY and LIMIT are ignored except for the first one.
  // See https://dev.mysql.com/doc/refman/5.7/en/union.html for details.
  notFirstUnionMember?: boolean;

  // When a SELECT action contains subqueries, we don't want
  // subqueries to keep calling `from` with the action table,
  // `SQLIO` uses this option to provide a fallback bound table
  // for subqueries when they don't have a bound table.
  groupTable?: mm.Table;
  // Like `contextTable`, a fallback value for `__name`, used by
  // TRANSACT members.
  actionName?: string;

  unsafeTableInput?: boolean;
}
