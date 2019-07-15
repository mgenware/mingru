class LineItem {
  constructor(public indent: number, public content: string) {}
}

export default class LinesBuilder {
  indent = 0;
  private lines: LineItem[] = [];

  push(content = '') {
    this.lines.push(new LineItem(this.indent, content));
  }

  pushLines(...lines: string[]) {
    for (const line of lines) {
      this.push(line);
    }
  }

  incrementIndent() {
    this.indent++;
  }

  decrementIndent() {
    this.indent--;
  }

  toString(): string {
    let s = '';
    for (const line of this.lines) {
      s += '\t'.repeat(line.indent) + line.content + '\n';
    }
    return s;
  }
}
