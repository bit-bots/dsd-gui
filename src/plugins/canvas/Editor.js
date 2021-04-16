import HistoryHandler from './HistoryHandler';
import LayerZoomPlugin from './LayerZoomPlugin';
import LayerDragPlugin from './LayerDragPlugin';
import ElementDragPlugin from './ElementDragPlugin';
import GroupingPlugin from './GroupingPlugin';
import DragAndDropPlugin from './DragAndDropPlugin';
import BasicPlugin from './BasicPlugin';
import ConnectionPlugin from './ConnectionPlugin';
import ActionStickyPlugin from './ActionStickyPlugin';
import RestructurePlugin from '@/plugins/canvas/RestructurePlugin';
import Instance from '@/entities/Instance';
import EditorUtils from '@/plugins/canvas/EditorUtils';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';
import Utils from '@/utils/Utils';
import FileController from '@/controller/FileController';
import  store  from '@/store/index';
import Node from '@/entities/Node';
import Output from '@/entities/Editor/Output';

export default class Editor{
    constructor(ref, scaleBy) {
        this._stage = new Konva.Stage({
                                          container: ref,
                                          draggable: false,
                                      });
        this._layer = new Konva.Layer();
        this._stage.add(this._layer);
        const container = this._stage.container();
        container.tabIndex = 1;
        container.focus();

        this._historyHandler = new HistoryHandler();
        this._layerZoomPlugin = new LayerZoomPlugin(this._stage, scaleBy);                  // finished
        this._layerDragPlugin = new LayerDragPlugin(this._stage);                           // finished
        this._groupingPlugin = new GroupingPlugin(this._stage, this._layer);                // check history
        this._elementDragPlugin = new ElementDragPlugin(this._stage, this._layer);          // finish
        this._connectionPlugin = new ConnectionPlugin(this._stage, this._layer);            // maybe finish
        this._dragAndDropPlugin = new DragAndDropPlugin(this._stage, this._layer);          // maybe finish
        this._basicPlugin = new BasicPlugin(this._stage, this._layer);
        this._actionStickyPlugin = new ActionStickyPlugin(this._stage, this._layer);
        this._restructurePlugin = new RestructurePlugin(this._stage, this._layer);

        // add layerPlugin to grouping Plugin to get information if the dragMode is enabled
        this._groupingPlugin.addLayerPlugin(this._layerDragPlugin);
        // add layerPlugin to set correct Cursor after hovering connections
        this._connectionPlugin.addLayerPlugin(this._layerDragPlugin);
        // add GroupingPlugin to save selected Shapes
        this._connectionPlugin.addGroupingPlugin(this._groupingPlugin);
        // add ConnectionPlugin to redraw on redo and undo
        this._elementDragPlugin.addConnectionPlugin(this._connectionPlugin)

        this._dragAndDropPlugin.addConnectionPlugin(this._connectionPlugin);
        this._dragAndDropPlugin.addGroupingPlugin(this._groupingPlugin);

        this._basicPlugin.addGroupingPlugin(this._groupingPlugin);
        this._basicPlugin.addConnectionPlugin(this._connectionPlugin);
        this._basicPlugin.addDragAndDropPlugin(this._dragAndDropPlugin);

        this._actionStickyPlugin.addGroupingPlugin(this._groupingPlugin);
        this._actionStickyPlugin.addDragAndDropPlugin(this._dragAndDropPlugin);

        // adding HistoryHandler to all Plugins
        this._layerZoomPlugin.addHistoryHandler(this._historyHandler);
        this._layerDragPlugin.addHistoryHandler(this._historyHandler);
        this._elementDragPlugin.addHistoryHandler(this._historyHandler);
        this._groupingPlugin.addHistoryHandler(this._historyHandler);
        this._connectionPlugin.addHistoryHandler(this._historyHandler);
        this._dragAndDropPlugin.addHistoryHandler(this._historyHandler);
        this._basicPlugin.addHistoryHandler(this._historyHandler);
        this._actionStickyPlugin.addHistoryHandler(this._historyHandler);
        this._layer.draw();
    }
    getSnapshot(){
      const instance = new Instance();
      const elements = this._layer.find(o => {
          return o.parent.getType() === 'Layer' && o.hasName('object')
      });
      instance.nodes = elements.map(element => EditorUtils.castNode(element, true))
      instance.connections = this._connectionPlugin.getAllConnections();
      instance.entryNode = instance.nodes.filter(node => node.customItem.type === ELEMENT_TYPE.ENTRY)[0];
      instance.name = instance.entryNode.customItem.name;
      return instance;
    }
    getStage(){
        return this._stage;
    }
    getLayer(){
        return this._layer;
    }
    getSelectedElements(){
        return this._layer.find('.selected').toArray();
    }
    setReloadFunction(func){
        this._reloadFunction = func;
    }

    setElementInstance(instance){
        this._dragAndDropPlugin.setElementFunction(instance.createElement);
        this._basicPlugin.setElementFunction(instance.createElement);
        this._actionStickyPlugin.setElementInstance(instance);
    }
    setUpdateCallback(callback){
        this._dragAndDropPlugin.setUpdateCallback(callback);
    }
    createSubtree(customItem){
        const removedNodes = this._dragAndDropPlugin.createSubtree(customItem);
        const instance = new Instance();
        instance.nodes = removedNodes.filter(o => o.customItem);
        instance.connections = removedNodes.filter( o=> o.fromId);
        instance.isBehaviorTree = false;
        instance.name = customItem.name;
        const entryCustomItem = JSON.parse(JSON.stringify(customItem));
        entryCustomItem.type = ELEMENT_TYPE.ENTRY;
        entryCustomItem.outputs = [new Output()]
        instance.entryNode = Utils.createEntry(instance.name, FileController.fileInfo(store.state.projectConfigurationLocal.path + Utils.getDir() + store.state.projectConfiguration.dsdFileName));
        instance.entryNode.position = instance.nodes[0].position;
        instance.entryNode.position.x  += 200;
        return instance;
    }
    createElement(node){
        this._dragAndDropPlugin.createElement(node, true);
    }
    createConnection(connection){
        this._connectionPlugin.createConnection(connection);
    }
    setEntryNode(entryNode){
        this._entryNode = entryNode;
    }
    restructure(){
        this._restructurePlugin.restructure(this._entryNode, this._connectionPlugin._connections);
        this._layer.draw();
        this._connectionPlugin.redrawAllConnections();
        this._layer.draw();
    }
    reloadFromFile(){
        this._groupingPlugin.unselectAll();
        this._layer.find('.object').destroy();
        this._layer.find('.connection').destroy();
        this._connectionPlugin.removeAll();
        this._reloadFunction();
    }
    resetHistory(){
        this._historyHandler.resetHistory();
    }
    setDragMode(value){
        this._layerDragPlugin.setDragMode(value);
    }
    getDragMode(){
        return this._layerDragPlugin.getDragMode();
    }
    setDimension(dimension){
        this._stage.width(dimension.width);
        this._stage.height(dimension.height);
    }
    updateElement(customItem, customAttributes, node){
        this._dragAndDropPlugin.updateElement( customItem, customAttributes, node);
    }

    scaleIn(){
        this._layerZoomPlugin.scaleIn();
    }
    scaleOut(){
        this._layerZoomPlugin.scaleOut();
    }
    canUndo(){
        return this._historyHandler.canUndo();
    }
    canRedo(){
        return this._historyHandler.canRedo();
    }
    undo(){
        this._historyHandler.undo();
    }
    redo(){
        this._historyHandler.redo();
    }
    canCopy(){
        return this._basicPlugin.canCopy();
    }
    canPaste(){
        return this._basicPlugin.canPaste();
    }
    canCut(){
        return this._basicPlugin.canCut();
    }
    copy(){
        this._basicPlugin.copy();
    }
    paste(){
        this._basicPlugin.paste();
    }
    cut(){
        this._basicPlugin.cut();
    }
    setAttr(type, value){
        this._stage.setAttr(type, value);
        this._stage.draw();
    }
}