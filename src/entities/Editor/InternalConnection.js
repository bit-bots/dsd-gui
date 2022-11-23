export default class InternalConnection {
  constructor(from, fromId, to, toId, outputname, line, uuid1) {
    this.from = from;
    this.fromId = fromId;
    this.to = to;
    this.toId = toId;
    this.outputname = outputname;
    this.line = line;
    this.uuid1 = uuid1;
  }
}
