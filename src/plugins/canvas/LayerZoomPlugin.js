import HistoryStateElement from '../../entities/HistoryStateElement';

export default class LayerZoomPlugin{
    constructor(stage, scaleBy) {
        this._stage = stage;
        this._scaleBy = scaleBy;
        this._lastTimeStamp = Date.now();
        this._startPositioni = undefined;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        // calculate new Scale
        stage.on('wheel', (e) => {
            e.evt.preventDefault();
            const oldScale = self._stage.scaleX();
            const oldPosition = self._stage.position();
            const mousePointTo = {
                x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
                y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
            };


            const newScale =
                    e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const newPos = {
                x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
                y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
            };
            const redoAttrs = self.setZoom({scale: newScale, position: newPos});
            self._history.setZoom(new HistoryStateElement(self.setZoom.bind(self), redoAttrs, self.setZoom.bind(self), {scale: oldScale, position: oldPosition}));
            self._history.updateZoom(redoAttrs);
        });
    }

    setZoom(attrs){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        self._stage.scale({x: attrs.scale, y: attrs.scale});
        if(attrs.position){
            self._stage.position(attrs.position)
        }
        self._stage.batchDraw();
        return attrs;
    }

    // get/set scale
    get scale(){
        return this._stage.scaleX();
    }
    set scale(value){
        this._stage.scale(value)
    }
    //  change scale
    scaleIn(){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const oldScale = self._stage.scaleX();
        const oldPosition = self._stage.position();
        const newScale = this._stage.scaleX() * this._scaleBy;
        const redoAttrs = self.setZoom({scale: newScale});
        self._history.setZoom(new HistoryStateElement(self.setZoom.bind(self), redoAttrs, self.setZoom.bind(self), {scale: oldScale, position: oldPosition}));
        self._history.updateZoom(redoAttrs);
    }
    scaleOut(){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const oldScale = self._stage.scaleX();
        const oldPosition = self._stage.position();
        const newScale = this._stage.scaleX() / this._scaleBy;
        const redoAttrs = self.setZoom({scale: newScale});
        self._history.setZoom(new HistoryStateElement(self.setZoom.bind(self), redoAttrs, self.setZoom.bind(self), {scale: oldScale, position: oldPosition}));
        self._history.updateZoom(redoAttrs);
    }


    addHistoryHandler(historyHandler){
        this._history = historyHandler;
    }


}