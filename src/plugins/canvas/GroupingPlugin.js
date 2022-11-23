import HistoryStateElement from "../../entities/HistoryStateElement";
import EditorUtils from "./EditorUtils";

export default class GroupingPlugin {
  constructor(stage, layer) {
    this._stage = stage;
    this._layer = layer;
    this._posStart = { x: 0, y: 0 };
    this._posEnd = undefined;
    this._updateCounter = 0;
    // every X tic the selected Shapes update while selecting
    this._updateIntervall = 50;
    this._updateShapesAtFinish = false;
    this._selectArea = new Konva.Rect({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      stroke: "#82B1FF",
      dash: [2, 2],
    });
    this._transformer = new Konva.Transformer({
      resizeEnabled: false,
      rotateEnabled: false,
      borderStrokeWidth: 0,
    });
    let isSelecting = false;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._selectArea.listening(false); // stop catching mouse events.
    layer.add(this._transformer);
    layer.add(this._selectArea);

    // start the rect drawing on mouse down or select/unselect if metakey pressed.
    stage.on("mousedown touchstart", function (e) {
      const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
      const object = e.target.parent;
      const isClickArea = !(
        e.target.hasName("input") ||
        e.target.hasName("output") ||
        e.target.hasName("outputText")
      );
      const isSelected = object ? object.hasName("selected") : false;
      const isObject = object ? object.hasName("object") : false;
      // return if right mouse or middle click
      if (e.evt.button !== 0) {
        return;
      }
      //click on connection is not handled by this plugin (see connection plugin)
      if (e.target.hasName("connection")) {
        self.unselectAll();
        return;
      }

      //handle events on object click
      if (isObject) {
        //handle events if metakey pressed
        if (metaPressed) {
          if (isSelected) {
            self.unselectShape(object);
            return;
          }
          self.selectShape(object);
          return;
        }
        if (isClickArea && !isSelected) {
          self.unselectAll();
          self.selectShape(object);
        }
      }
      // handle drawing selectionbox
      if (e.target === self._stage && !self._layerDragPlugin._enabledDragMode) {
        isSelecting = true;
        self.startDrag(EditorUtils.getRelativePointerPosition(self._stage));
      }
      self._layer.draw();
    });

    // update the rect on mouse move - note use of 'mode' var to avoid drawing after mouse released.
    stage.on("mousemove", function () {
      if (!isSelecting) {
        return;
      }
      self.updateDrag(EditorUtils.getRelativePointerPosition(self._stage));
      self._updateCounter %= self._updateIntervall;
      if (!self._updateShapesAtFinish && self._updateCounter === 0) {
        self.updateSelectedShapes();
      }
      self._updateCounter++;
      self._layer.draw();
    });
    stage.on("mouseup", function () {
      if (isSelecting) {
        isSelecting = false;
        self.updateSelectedShapes();
        self._selectArea.visible(false);
        self._layer.draw();
      }
    });
  }
  addHistoryHandler(historyHandler) {
    this._history = historyHandler;
  }
  addLayerPlugin(layerPlugin) {
    this._layerDragPlugin = layerPlugin;
  }

  startDrag(posIn) {
    this._posStart = { x: posIn.x, y: posIn.y };
    this._posNow = { x: posIn.x + 1, y: posIn.y + 1 };
    this.unselectAll();
  }
  updateDrag(posNow) {
    this._selectArea.setAttrs({
      x: Math.min(this._posStart.x, posNow.x) || 1,
      y: Math.min(this._posStart.y, posNow.y) || 1,
      width: Math.abs(this._posStart.x - posNow.x) || 1,
      height: Math.abs(this._posStart.y - posNow.y) || 1,
      visible: true,
    });
  }
  //by transformer = select all Elements which are included in the transformer
  updateSelectedShapes(byTransformer) {
    const shapes = this._layer
      .find((node) => {
        return node.parent.getType() === "Layer" && node.hasName("object");
      })
      .toArray();
    const unselectedElements = [];
    shapes.forEach((shape) => {
      if (byTransformer) {
        if (this._transformer.nodes().includes(shape)) {
          this.selectShape(shape);
        } else {
          if (shape.hasName("selected")) {
            this.unselectShape(shape);
            unselectedElements.push(shape);
          }
        }
      } else {
        if (Konva.Util.haveIntersection(shape.getClientRect(), this._selectArea.getClientRect())) {
          this.selectShape(shape);
        } else {
          if (shape.hasName("selected")) {
            this.unselectShape(shape);
            unselectedElements.push(shape);
          }
        }
      }
    });
    return unselectedElements;
  }
  selectShape(shape) {
    if (!shape.hasName("selected")) {
      shape.addName("selected");
      shape.findOne(".background").setAttrs({
        shadowColor: "white",
        shadowBlur: 10,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 1,
      });
      const nodes = this._transformer.nodes();
      nodes.push(shape);
      this._transformer.nodes(nodes);
      if (shape.hasName("periode")) {
        this.selectChildShape(shape.findOne("Group"));
      }
    }
  }
  selectChildShape(child) {
    if (!child.hasName("childSelected")) {
      child.addName("childSelected");
      child.findOne(".background").setAttrs({
        shadowColor: "white",
        shadowBlur: 10,
        shadowOffset: { x: 1, y: 1 },
        shadowOpacity: 1,
      });
      if (child.hasName("periode")) {
        this.selectChildShape(child.findOne("Group"));
      }
    }
  }
  unselectShape(shape) {
    if (shape.hasName("selected")) {
      shape.removeName("selected");
      shape.findOne(".background").setAttrs({
        shadowOpacity: 0,
      });
      const nodes = this._transformer.nodes();
      this._transformer.nodes(nodes.filter((o) => o !== shape));
      if (shape.hasName("periode")) {
        this.unselectChildShape(shape.findOne("Group"));
      }
    }
  }
  unselectChildShape(child) {
    if (child.hasName("childSelected")) {
      child.removeName("childSelected");
      child.findOne(".background").setAttrs({
        shadowOpacity: 0,
      });
      if (child.hasName("periode")) {
        this.unselectChildShape(child.findOne("Group"));
      }
    }
  }
  unselectAll() {
    this.updateDrag(this._posStart);
    const unselectedElementes = this.updateSelectedShapes();
    this._selectArea.visible(false);
    this._layer.draw(); // redraw to force update all elements
    return unselectedElementes;
  }
  selectAll(uuid1s) {
    this.unselectAll();
    uuid1s.forEach((uuid1) => {
      const shape = this._layer.findOne("." + uuid1);
      if (shape) {
        this.selectShape(shape);
      }
    });
  }

  getHistoryState() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return new HistoryStateElement(self.setHistorySelect.bind(self), {
      uuids: self._transformer.nodes().map((shape) => shape.id()),
      redoUndo: true,
    });
  }
  setHistorySelect(attrs) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const nodes = [];
    attrs.uuids.forEach((uuid) => {
      const node = self._layer.findOne("#" + uuid);
      if (!node) {
        console.log("node not found");
      }
      nodes.push(node);
    });
    self._transformer.nodes(nodes);
    self.updateSelectedShapes(true);
  }
}
