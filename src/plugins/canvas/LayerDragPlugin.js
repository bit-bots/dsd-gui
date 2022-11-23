import HistoryStateElement from "../../entities/HistoryStateElement";

export default class LayerDragPlugin {
  constructor(stage) {
    this._stage = stage;
    this._enabledDragMode = false;
    this._stageMoving = false;
    this._startPosition = undefined;
    this._prePosition = undefined;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    // start dragging Layer
    stage.on("mousedown", function (e) {
      // check if correct mousekey pressed or dragmode enabled
      if ((e && (e.evt.which === 2 || e.evt.which === 4)) || self._enabledDragMode) {
        self._startPosition = self.getActualPosition();
        self._prePosition = stage.getPointerPosition();
        stage.container().style.cursor = "grabbing";
        self._stageMoving = true;
      }
    });
    // redraw the Layer
    stage.on("mousemove", function () {
      if (!self._stageMoving) {
        return;
      }
      const actualPos = stage.getPointerPosition();
      //const actualPos = EditorUtils.getRelativePointerPosition(stage);

      const diffPos = {
        x: self._prePosition.x - actualPos.x,
        y: self._prePosition.y - actualPos.y,
      };
      const newPos = {
        x: stage.x() - diffPos.x,
        y: stage.y() - diffPos.y,
      };
      self._prePosition = actualPos;
      stage.position(newPos);
      stage.batchDraw();
    });
    // stop layer dragging
    stage.on("mouseup", function () {
      if (self._stageMoving) {
        self._stageMoving = false;
        if (self._enabledDragMode) {
          stage.container().style.cursor = "grab";
          return;
        }
        stage.container().style.cursor = "default";
        const historyState = self.commitPosition();
        self._history.addStateHistory([historyState]);
      }
    });
  }
  // enable/diable Dragmode
  setDragMode(value) {
    this._enabledDragMode = value;
    if (this._enabledDragMode) {
      this._stage.container().style.cursor = "grab";
      return;
    }
    this._stage.container().style.cursor = "default";
  }
  getDragMode() {
    return this._enabledDragMode;
  }

  // add the Reference to the HistoryHandler
  addHistoryHandler(historyHandler) {
    this._history = historyHandler;
  }

  commitPosition() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const endPosition = self.getActualPosition();
    return new HistoryStateElement(
      self.setActualPosition.bind(self),
      endPosition,
      self.setActualPosition.bind(self),
      self._startPosition
    );
  }
  getActualPosition() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return { x: self._stage.x(), y: self._stage.y() };
  }
  setActualPosition(attrs) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self._stage.position(attrs);
    self._stage.batchDraw();
  }
}
