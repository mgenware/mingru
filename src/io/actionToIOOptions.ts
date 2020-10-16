import Dialect from '../dialect';

export interface ActionToIOOptions {
  dialect: Dialect;

  // If true, SELECT processors skip result type generation.
  // Used in UNIONs and subquieries.
  selectionLiteMode?: boolean;
}
