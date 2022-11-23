import EditorUtils from "./EditorUtils";

export default class BasicPlugin {
  constructor(stage, layer) {
    this._stage = stage;
    this._layer = layer;
    const container = stage.container();
    this._store = [];
    this._elementFunction = undefined;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    let ctrlDown = false;
    const ctrlKey = 17,
      cmdKey = 91,
      vKey = 86,
      cKey = 67,
      xKey = 88;
    container.addEventListener("keydown", function (e) {
      if (e.keyCode === ctrlKey || e.keyCode === cmdKey) {
        ctrlDown = true;
      }
    });
    container.addEventListener("keyup", function (e) {
      if (e.keyCode === ctrlKey || e.keyCode === cmdKey) {
        ctrlDown = false;
      }
    });
    container.addEventListener("keydown", function (e) {
      if (ctrlDown && e.keyCode === cKey) {
        self.copy();
      }
      if (ctrlDown && e.keyCode === vKey) {
        self.paste();
      }
      if (ctrlDown && e.keyCode === xKey) {
        self.cut();
      }
    });
  }
  setElementFunction(func) {
    this._elementFunction = func;
  }
  addHistoryHandler(historyHandler) {
    this._history = historyHandler;
  }
  addDragAndDropPlugin(dragAndDropPlugin) {
    this._dragAndDropPlugin = dragAndDropPlugin;
  }
  addGroupingPlugin(groupingPlugin) {
    this._groupingPlugin = groupingPlugin;
  }
  addConnectionPlugin(connectionPlugin) {
    this._connectionPlugin = connectionPlugin;
  }
  canCopy() {
    return this._layer.find(".selected").toArray().length > 0;
  }
  copy() {
    if (this.canCopy()) {
      const objects = this._layer.find(".selected").toArray(); // getting all selected Elements
      const lines = this._connectionPlugin.getConnectionsBetween(objects); // getting all Connections between the selected Element
      this._store = objects.concat(lines); // update the store !!order matters!! for paste
    }
  }
  canPaste() {
    return this._store.length > 0;
  }
  paste() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const newStore = [];
    const newIdMap = {};
    const elementsToPaste = this._store;
    const historyElements = [];
    if (!elementsToPaste || elementsToPaste.length <= 0) {
      return;
    }
    //historyElements.push(self._groupingPlugin.getHistoryState())            // save the actual selectedElements
    self._groupingPlugin.unselectAll(); // unselect all Elements
    elementsToPaste.forEach((element) => {
      // iterate all Elements to paste
      if (element.fromId) {
        // if element is a connections
        const from = this._layer.findOne("#" + newIdMap[element.fromId]);
        const to = this._layer.findOne("#" + newIdMap[element.toId]);
        if (from && to) {
          const newConnection = Object.assign({}, element);
          newConnection.fromId = newIdMap[element.fromId];
          newConnection.toId = newIdMap[element.toId];
          newConnection.uuid1 = undefined;
          const historyElement = this._connectionPlugin.createConnection(newConnection);
          historyElements.push(historyElement);
          newStore.push(newConnection);
          this._layer.draw();
        }
      } else {
        // else element is a node
        const uuid1 = EditorUtils.uuidv1(); // generating ne uuid1 for the element
        newIdMap[element.id()] = element.id().split("$")[0] + "$" + uuid1; // temporary save it to get access for the connections to add
        const node = EditorUtils.castNode(element);
        node.uuid1 = newIdMap[element.id()].split("$")[1];
        node.position.x += 10;
        node.position.y += 10;
        const historyElement = this._dragAndDropPlugin.createElement(node); // creating element on layer
        const newElement = self._layer.findOne("#" + newIdMap[element.id()]);
        newStore.push(newElement); // update new Store
        historyElements.push(historyElement);
        //self._groupingPlugin.selectShape(historyElement.attrs.element);      // selecting the shape
        this._layer.draw();
      }
    });
    this._store = newStore;
    self._history.addStateHistory(historyElements);
  }
  canCut() {
    return this._layer.find(".selected").toArray().length > 0;
  }
  cut() {
    if (this.canCut()) {
      this._store = [];
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      const objects = self._layer.find(".selected").toArray();
      const lines = self._connectionPlugin.getConnectionsBetween(objects);
      self._store = objects.concat(lines); // order matters
      const historyElements = self._dragAndDropPlugin.removeElements(); //inplice the connections
      self._history.addStateHistory(historyElements);
      this._layer.draw();
    }
  }
}
