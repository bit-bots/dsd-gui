

export default class HistoryHandler{
    constructor() {
        this._appHistory = [];
        this._appHistoryStep = 0;
        this._isZooming = false;
    }
    resetHistory(){
        this._appHistory = [];
        this._appHistoryStep = 0;
        this._isZooming =false;
    }
    addStateHistory(state){
        this._isZooming = false;
        if(this._appHistoryStep < this._appHistory.length){
            const doneChanges = this._appHistory.slice(this._appHistoryStep , this._appHistory.length-1).reverse();
            this._appHistory = this._appHistory.concat(doneChanges);
        }
        this._appHistoryStep = this._appHistory.length + 1;
        this._appHistory = this._appHistory.concat([state]);
    }
    setZoom(historyState){
        if(!this._isZooming){
            this.addStateHistory([historyState]);
        }
        this._isZooming = true;
    }
    updateZoom(newEndposition){
        if(this._isZooming){
            this._appHistory[this._appHistory.length-1][0].redoAttrs = newEndposition;
        }
    }
    ignoreLast(){
        this._appHistory = this._appHistory.slice(0, this._appHistory.length-1);
        this._appHistoryStep--;
    }
    undo(){
        if (this._appHistoryStep === 0) {
            return;
        }
        this._appHistoryStep -= 1;
        const states = this._appHistory[this._appHistoryStep];
        states.forEach(historyStateElement => {
                historyStateElement.undoFunc(historyStateElement.undoAttrs);
        })
    }
    canUndo(){
        return this._appHistoryStep !== 0;
    }
    canRedo(){
        return this._appHistory.length > 0 && (this._appHistoryStep < this._appHistory.length)
    }
    redo(){
        if (this._appHistoryStep === this._appHistory.length) {
            return;
        }
        const states = this._appHistory[this._appHistoryStep];
        this._appHistoryStep += 1;
        states.reverse().forEach(historyStateElement => {
            historyStateElement.redoFunc(historyStateElement.redoAttrs)
        })


    }
}