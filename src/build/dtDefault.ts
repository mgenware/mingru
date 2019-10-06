import * as dd from 'mingru-models';

export default function dtDefault(type: string): unknown | null {
  const { dt } = dd;
  switch (type) {
    case dt.bigInt:
    case dt.smallInt:
    case dt.int:
    case dt.tinyInt:
    case dt.bool:
      return 0;

    case dt.char:
    case dt.varChar:
    case dt.text:
      return '';

    case dt.float:
    case dt.double:
      return 0.0;

    default:
      return null;
  }
}
