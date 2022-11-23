import HistoryStateElement from "../../entities/HistoryStateElement";

export default class ElementDragPlugin {
  constructor(stage, layer) {
    this._stage = stage;
    this._layer = layer;
    this._committing = false;
    this._startAttrs = [];
    this._canBeActionSticky = false;
    this._stoppedAtAction = false;
    this._splitActionPeriode = false;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    stage.on("dragstart", function () {
      // ignore all other dragstartevents while already dragging;
      if (self._committing) {
        return;
      }
      self._canBeActionSticky = false;
      self._stoppedAtAction = false;
      self._committing = true;
      self._splitActionPeriode = false;
      self._startAttrs = self.getActualPositions(true);
    });
    stage.on("dragend", function (e) {
      if (self._committing) {
        self._committing = false;
        if (self._canBeActionSticky) {
          self._layer.children.each((target) => {
            if (
              target.hasName("ACTION") &&
              Konva.Util.haveIntersection(target.getClientRect(), e.target.getClientRect())
            ) {
              if (target === e.target) {
                return;
              }
              self._stoppedAtAction = true;
            }
          });
        }
        if (self._stoppedAtAction || self._splitActionPeriode) {
          return;
        }
        self._history.addStateHistory(self.commitPosition());
      }
    });
  }
  setActualPosition(attrs) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const element = self._layer.findOne((node) => {
      return node.parent.getType() === "Layer" && node.id() === attrs.id;
    });
    element.position(attrs.position);
    self._connectionPlugin.redrawAllConnections();
    self._layer.draw();
  }
  addHistoryHandler(historyHandler) {
    this._history = historyHandler;
  }
  addConnectionPlugin(connectionPlugin) {
    this._connectionPlugin = connectionPlugin;
  }
  commitPosition() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const historyStates = [];
    const redoPositions = self.getActualPositions(false);
    for (let i = 0; i < redoPositions.length; i++) {
      historyStates.push(
        new HistoryStateElement(
          self.setActualPosition.bind(self),
          redoPositions[i],
          self.setActualPosition.bind(self),
          self._startAttrs[i]
        )
      );
    }
    return historyStates;
  }
  getActualPositions(start) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const draggedItems = this._stage.find(".selected").toArray();
    const attrs = [];
    draggedItems.forEach((shape) => {
      attrs.push({ id: shape.id(), position: shape.position() });
    });
    if (draggedItems.length === 1 && draggedItems[0].hasName("ACTION") && start) {
      self._canBeActionSticky = true;
      if (draggedItems[0].parent.hasName("periode") || draggedItems[0].hasName("wasPeriode")) {
        self._splitActionPeriode = true;
      }
    }
    return attrs;
  }
}
