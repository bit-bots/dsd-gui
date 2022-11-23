export default class Element {
  constructor(name, type, containingFile, uuid, outputs, parameters) {
    this.containingFile = containingFile;
    this.type = type;
    this.name = name;
    this.uuid = uuid;
    this.outputs = outputs ? outputs : [];
    this.parameters = parameters ? parameters : [];
  }
}
