export default class Tab {
  constructor(treeElement, saved, id, favico, closeable) {
    this.item = treeElement;
    this.saved = saved;
    this.key = id;
    this.favico = favico;
    this.label = treeElement.name;
    this.closeable = closeable;
    this.updateSaveStatus(saved);
  }
  updateSaveStatus(status) {
    if (this.saved === status) {
      return;
    }
    if (status) {
      this.label = this.label.substring(0, this.label.length - 1);
      this.saved = status;
      return;
    }
    this.label += "*";
    this.saved = status;
  }
}
