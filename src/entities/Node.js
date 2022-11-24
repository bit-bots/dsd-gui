export default class {
  constructor(customItem, customAttr, uuid1, position, periode) {
    this.customItem = customItem;
    this.customAttr = customAttr ? customAttr : {};
    this.uuid1 = uuid1;
    this.position = position;
    this.periode = periode;
  }
}
