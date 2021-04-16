import { ELEMENT_TYPE } from '../../enumerates/ElementType';
import EditorUtils from './EditorUtils';
import HistoryStateElement from '../../entities/HistoryStateElement';

export default class ActionStickyPlugin{
    constructor(stage, layer) {

        this._layer = layer;
        this._stage = stage;
        this._splitHistory = undefined;
        this._startSave = undefined;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;

        layer.on('dragstart', function (e){
            const selected = e.target;
            const selectedElements = layer.find('.selected').toArray();
            if(selectedElements.length !== 1 || !selectedElements[0].hasName('ACTION')){
                return;
            }
            self._targetToHandle = selected;
            self._startSave = EditorUtils.getNode(selected);


            if(selected.parent.hasName('periode')){
                const pos = EditorUtils.getRelativePointerPosition(self._stage);
                const selectedId = selected.id();
                self._splitHistory = self.split({selectedId, pos}, true);
            }else{
                self._splitHistory = undefined;
            }
        })

        layer.on('dragmove', e => {
            const selected = e.target;        // Group
            const selectedRect = e.target.getClientRect();
            if(self._targetToHandle && self._targetToHandle === selected){
                layer.children.each(function (target){                                              //checking for preview
                    if (target === selected) {
                        return;
                    }
                    if(target.hasName('ACTION')){
                        if(Konva.Util.haveIntersection(target.getClientRect(), selectedRect)){
                            if(!target.findOne('.periodePreview')){
                                target.add(self.createActionPeriodePreview(selected, target));
                            }
                        }else if(target.findOne('.periodePreview')){
                            target.findOne('.periodePreview').remove();
                        }
                    }
                })
            }
        });
        layer.on('dragend', e => {
            const selected = e.target;
            const selectedRect = e.target.getClientRect();
            if(self._targetToHandle && self._targetToHandle === selected){
                self._targetToHandle = undefined;
                if(self._splitHistory){
                    selected.removeName('wasPeriode');
                    self._splitHistory.redoAttrs.pos = selected.position();
                    self._history.addStateHistory([self._splitHistory]);
                }

                layer.children.each(function (target){
                    if (target === selected) {
                        return;
                    }
                    if(target.hasName('ACTION')){
                        if(Konva.Util.haveIntersection(target.getClientRect(), selectedRect)){
                            if(target.findOne('.periodePreview')){
                                target.findOne('.periodePreview').remove();
                                const historyElements = self.concat({selected: self._startSave, target: EditorUtils.getNode(target)});
                                self._history.addStateHistory(historyElements);
                            }
                        }
                    }
                })
            }
        })

    }
    concat(attrs){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const target = this._layer.findOne(node => {
            return node.parent.getType() === 'Layer' && node.id() === attrs.target.customItem.uuid + '$' + attrs.target.uuid1;
        });
        const selected = this._layer.findOne(node => {
            return node.parent.getType() === 'Layer' && node.id() === attrs.selected.customItem.uuid + '$' + attrs.selected.uuid1;
        });
        this._elementInstance.concatActionElement(selected,target);
        const history =this._dragAndDropPlugin.removeElement(selected.id()); // update Position
        const historyState = new HistoryStateElement(self.concat.bind(self), attrs, self.split.bind(self), { selectedId: attrs.selected.customItem.uuid + '$' + attrs.selected.uuid1, pos: attrs.selected.position });
        return [historyState].concat(history);
    }
    addGroupingPlugin(groupingPlugin){
        this._groupingPlugin = groupingPlugin;
    }
    addHistoryHandler(historyHandler){
        this._history = historyHandler;
    }
    setElementInstance(func){
        this._elementInstance = func;
    }
    addDragAndDropPlugin(dragAndDropPlugin){
        this._dragAndDropPlugin = dragAndDropPlugin;
    }
    resetWidth(selected, width){
        selected.size({
                          width: selected.size().width -width,
                          height: selected.size().height
                      })
        if(selected.parent.hasName('periode')){
            this.resetWidth(selected.parent, width)
        }
    }
    //creating an ActionPeriodePreview
    createActionPeriodePreview(selected, target){
        const height = Math.min(selected.size().height, target.size().height);
        const periodeElement = this._elementInstance.createActionPeriodeElement(selected, height)
        periodeElement.addName('periodePreview');
        periodeElement.opacity(0.5);
        periodeElement.x(target.size().width);
        return periodeElement;
    }

    split(attrs, onMove){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const selected = this._layer.findOne('#' + attrs.selectedId);
        const target = EditorUtils.castNode(selected);
        let widthToReset = 0;
        let firstPeriode = undefined;
        if (selected.parent.hasName('container')) {
            widthToReset = selected.parent.size().width;
            firstPeriode = selected.parent.parent;
            this.resetWidth(firstPeriode, widthToReset);
            selected.parent.parent.removeName('periode');
            selected.parent.remove();
        } else {
            widthToReset = selected.size().width;
            firstPeriode = selected.parent;
            this.resetWidth(firstPeriode, widthToReset);
            selected.parent.removeName('periode');
        }
        if(onMove){
            selected.addName('wasPeriode');
        }
        //const pos = this.groupingPlugin.getRelativePointerPosition(this._stage);
        selected.x(attrs.pos.x)
        selected.y(attrs.pos.y)
        selected.moveTo(this._layer);
        this._layer.draw();
        return new HistoryStateElement(self.split.bind(self), { selectedId: selected.id() }, self.concat.bind(self), {target, selected: EditorUtils.getNode(selected)})
    }
}




