import chalk from 'chalk';

export default class Logger {
  constructor(public enabled: boolean) {}
  info(s: string) {
    if (!this.enabled) {
      return;
    }
    this.log(chalk.blue(s));
  }

  debug(s: string) {
    if (!this.enabled) {
      return;
    }
    this.log(chalk.gray(s));
  }

  private log(s: string) {
    // tslint:disable-next-line no-console
    console.log(s);
  }
}
