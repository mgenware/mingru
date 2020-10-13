class LineItem {
  constructor(public indent: number, public content: string) {}
}

export default class LinesBuilder {
  private indent = 0;
  private lines: LineItem[] = [];

  push(content = '') {
    this.lines.push(new LineItem(this.indent, content));
  }

  pushLines(...lines: Array<string | null>) {
    for (const line of lines) {
      if (line !== null) {
        this.push(line);
      }
    }
  }

  pushSeparator() {
    if (this.lines.length) {
      this.push();
    }
  }

  increaseIndent() {
    this.indent++;
  }

  decreaseIndent() {
    this.indent--;
  }

  pushBuilder(builder: LinesBuilder) {
    const { indent } = this;
    for (const line of builder.lines) {
      this.lines.push(new LineItem(line.indent + indent, line.content));
    }
  }

  toString(): string {
    let s = '';
    for (const line of this.lines) {
      if (line.content !== '') {
        s += '\t'.repeat(line.indent) + line.content;
      }
      s += '\n';
    }
    return s;
  }
}
