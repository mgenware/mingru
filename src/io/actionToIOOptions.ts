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

  // Subqueries use this value to locate the outer `sqlGroupTable`.
  outerGroupTable?: mm.Table;
}
