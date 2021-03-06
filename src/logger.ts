import chalk from 'chalk';

export class Logger {
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

  // eslint-disable-next-line class-methods-use-this
  private log(s: string) {
    // eslint-disable-next-line no-console
    console.log(s);
  }
}

const logger = new Logger(false);
export default logger;
