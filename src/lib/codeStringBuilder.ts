/* eslint-disable class-methods-use-this */

// Used to build string segments, e.g. "abc"+code+"cde".
// It also ensures multiple consecutive calls to `addString` will have a single
// string literal in generated code.
export class CodeStringBuilder {
  private code = '';
  private pendingString = '';
  private isSealed = false;

  addString(s: string) {
    this.pendingString += s;
  }

  addCode(s: string) {
    this.flushPendingString();
    this.addPlusIfNeeded();
    this.code += s;
  }

  finish(): string {
    if (this.isSealed) {
      return this.code;
    }
    this.flushPendingString();
    this.isSealed = true;
    return this.code;
  }

  private flushPendingString() {
    if (this.pendingString) {
      this.addPlusIfNeeded();
      this.code += this.makeStringLiteral(this.pendingString);
      this.pendingString = '';
    }
  }

  private makeStringLiteral(s: string): string {
    return JSON.stringify(s);
  }

  private addPlusIfNeeded() {
    if (this.code) {
      this.code += '+';
    }
  }
}
