import * as mm from 'mingru-models';
import { Dialect } from '../dialect.js';

export interface ActionToIOOptions {
  dialect: Dialect;

  // If true, SELECT processors skip result type generation.
  // Used in UNIONs and subqueries.
  selectionLiteMode?: boolean;

  // Indicates a UNION member that is not the first child.
  // UNION member ORDER BY and LIMIT are ignored except for the first one.
  // See https://dev.mysql.com/doc/refman/5.7/en/union.html for details.
  notFirstUnionMember?: boolean;

  // Action name of outer scope. Used as a fallback value if current action
  // doesn't have this property. e.g. tmp actions and TX members.
  outerActionName?: string;

  // Like `outerActionName`. A fallback value for `groupTable` of outer scope.
  outerGroupTable?: mm.Table;
}
