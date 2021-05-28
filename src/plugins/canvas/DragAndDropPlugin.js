import HistoryStateElement from '../../entities/HistoryStateElement';
import EditorUtils from './EditorUtils';
import Node from '../../entities/Node';

export default class DragAndDropPlugin{
    constructor(stage, layer) {
        this._stage = stage;
        this._layer = layer;
        const container = stage.container();
        this._elementFunction = undefined;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const entfKey = 46;
        container.addEventListener('keydown', function (e){
            if(e.keyCode === entfKey){
                self.removeElementsWithHistory()
            }
        })
        container.addEventListener('dragover', function (e){
            e.preventDefault();
        })
        container.addEventListener('drop', function (e){
            e.preventDefault();
            stage.setPointersPositions(e);
            const item = JSON.parse(e.dataTransfer.getData('item'));
            const node = new Node(item, {}, EditorUtils.uuidv1())
            const historyState = self.createElement(node, true);
            self._history.addStateHistory([historyState]);
            layer.draw();
        })
    }
    setElementFunction(func){
        this._elementFunction = func;
    }
    setUpdateCallback(callback){
        this._updateCallback = callback;
    }
    addHistoryHandler(historyHandler){
        this._history = historyHandler;
    }
    addConnectionPlugin(connectionPlugin){
        this._connectionPlugin = connectionPlugin
    }
    addGroupingPlugin(groupingPlugin){
        this._groupingPlugin = groupingPlugin;
    }
    removeElementsWithHistory(){
        const historyState = this.removeElements();
        if(historyState){
            this._history.addStateHistory(historyState);
        }
    }
    removeElements(){
        let historyStates = [];
        const elementsToRemove = this._groupingPlugin.unselectAll()
        if(elementsToRemove.length > 0){
            elementsToRemove.forEach(element => {
                if(!element.hasName('ENTRY')){
                    historyStates = historyStates.concat(this.removeElement(element.id()));
                }
            });
            this._layer.draw();
            const removedConnectionsHistory = this._connectionPlugin.clearConnections();
            historyStates = historyStates.concat(removedConnectionsHistory);
            return historyStates;
        }
        return undefined;
    }
    removeElement(uuid, removeConnections){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const element = self._layer.findOne(node => {
                return node.parent.getType() === 'Layer' && node.id() === uuid
        });
        self._groupingPlugin.unselectShape(element);
        const node = EditorUtils.castNode(element);
        const hirsotryState = new HistoryStateElement(self.removeElement.bind(self),uuid,self.createElement.bind(self),node)
        element.destroy();
        self._layer.draw();
        if(removeConnections){
            const removedConnectionsHistory = this._connectionPlugin.clearConnections();
            self._layer.draw();
            return [hirsotryState].concat(removedConnectionsHistory);
        }
        return [hirsotryState];
    }
    createSubtree(customItem){
        const historyStates = this.removeElements();
        this._layer.draw();
        const result = JSON.parse(JSON.stringify(historyStates)).map(o => o.undoAttrs);
        const node = new Node(customItem, {}, EditorUtils.uuidv1())
        const historyState = this.createElement(node);
        historyStates.push(historyState);
        this._history.addStateHistory(historyStates);
        this._layer.draw();
        return result;
    }
    createElement(node, initialCreate){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        if(!self._elementFunction) {
            console.log('No Function for create Elements initalized');
        }
        const element = self._elementFunction(node);
        const pos = node.position ? node.position : EditorUtils.getRelativePointerPosition(self._stage);
        element.position(pos)
        const initializedNode = EditorUtils.castNode(element);
        self._layer.add(element);
        self._layer.draw();
        if(!initialCreate){
            self._connectionPlugin.updateConnectionRefs();
            self._updateCallback(node.customItem);
        }
        return new HistoryStateElement(self.createElement.bind(self), initializedNode, self.removeElement.bind(self), initializedNode.customItem.uuid + '$' + initializedNode.uuid1);

    }
    updateElement(customItem, customAttr, node){
        const historyState = this.update({customItem, customAttr, node})
        this._history.addStateHistory([historyState]);
    }
    update(attrs){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        let beforeNode = undefined;
        self._groupingPlugin.unselectAll();
        const elements = this._layer.find('.' + attrs.customItem.uuid).toArray();
        elements.forEach(element => {
            if(!beforeNode){        // fallback
                beforeNode = EditorUtils.castNode(element);
            }
            const updatedElement = EditorUtils.castNode(element);
            updatedElement.customItem = attrs.customItem;
            if(element.id() === attrs.node.customItem.uuid + '$' + attrs.node.uuid1){
                beforeNode = EditorUtils.castNode(element);
                updatedElement.customAttr = attrs.customAttr;
            }
            this.removeElement(updatedElement.customItem.uuid + '$' + updatedElement.uuid1, false);
            this._layer.draw();
            this.createElement(updatedElement)
            this._layer.draw();
        })
        this._connectionPlugin.updateConnectionRefs(attrs.customItem);
        this._layer.draw();
        this._connectionPlugin.redrawAllConnections();
        for(let i = 0; i < beforeNode.customItem.outputs.length; i++){
            const correspondendingOutput = attrs.customItem.outputs.filter( o => o.before === beforeNode.customItem.outputs[i].name);
            if(correspondendingOutput && correspondendingOutput.length > 0){
                beforeNode.customItem.outputs[i].before = correspondendingOutput[0].name;
                beforeNode.customItem.outputs[i].name = correspondendingOutput[0].before;
            }
        }
        // ovveride before Values
        // for(let i = 0; i < beforeNode.customItem.outputs.length; i++){
        //     const kp = attrs.customItem.outputs.filter( o => o.before === beforeNode.customItem.outputs[i].before);
        //     if(kp && kp.length > 0){
        //
        //         beforeNode.customItem.outputs[i].before = JSON.parse(JSON.stringify(kp[0].name));
        //         beforeNode.customItem.outputs[i].name = JSON.parse(JSON.stringify(kp[0].before));
        //     }
        // }
        // beforeNode = JSON.parse(JSON.stringify(beforeNode));
        return  new HistoryStateElement(self.update.bind(self), attrs, self.update.bind(self), {customItem: beforeNode.customItem, customAttr: beforeNode.customAttr, node: beforeNode});
    }

}