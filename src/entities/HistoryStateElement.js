export default class HistoryStateElement{
    constructor(redoFunc, redoAttrs, undoFunc, undoAttrs) {
        this.redoFunc = redoFunc;
        this.redoAttrs = redoAttrs;
        this.undoFunc = undoFunc;
        this.undoAttrs = undoAttrs;
    }

}