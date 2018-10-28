import Dialect from 'dialect';

export class View {
  constructor(
    public name: string,
  ) { }
}

export class ViewIO {
  constructor(
    public sql: string,
    public dialect: Dialect,
  ) { }
}

export default View;
