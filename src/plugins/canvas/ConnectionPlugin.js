import EditorUtils from './EditorUtils';
import HistoryStateElement from '../../entities/HistoryStateElement';
import InternalConnection from '../../entities/Editor/InternalConnection';
import Connection from '../../entities/Editor/Connection';
import store from '../../store/index';
import vuetify from '@/plugins/vuetify';

export default class ConnectionPlugin {
    constructor(stage, layer) {
        this._layer = layer;
        this._stage = stage;
        this._connections = [];
        this._drawingLine = false;
        this._actualLine = undefined;
        this._startItem = undefined;
        this._startType = undefined;
        this._outputName = undefined;
        this._selectedConnectionId = undefined;
        this._hoveredConnector = undefined;
        this._hoveredText = undefined;
        this._preSelectedElementHistory = undefined;
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const entfKey = 46;
        stage.container().addEventListener('keydown', function (e){
            if(e.keyCode === entfKey){
                const stateHistory = self.removeConnectionById(self._selectedConnectionId);
                self._history.addStateHistory([stateHistory]);
            }
        })
        stage.on('mousedown touchstart', function(e){
            const target = e.target;
            const startDrawLine = target.hasName('input') || target.hasName('output') || target.hasName('outputText');

            // basic visualistion for the connections
            if(target.hasName('connection') && self._selectedConnectionId !== target.id()){
                self.selectConnection(target);
            }else if(!target.hasName('connection')){
                self.unselectConnection();
            }
            if(!startDrawLine){
                return;
            }
            // define default values
            const group = target.getParent();
            self._startItem = group;
            group.draggable(false);
            self._preSelectedElementHistory = self._groupingPlugin.getHistoryState()
            self._groupingPlugin.unselectAll();
            self._drawingLine = true;
            self._startType = 'OUTPUT';
            let color = 'white';
            const pointerPosition = EditorUtils.getRelativePointerPosition(stage);
            let connector = undefined;

            // change default values depending on the state
            if(target.hasName('output')){
                color = target.getAttr('color')
                self._outputName = target.id();
                connector = target;
            }
            if(target.hasName('outputText')){
                const output = group.findOne('#' + target.text());
                self._outputName = target.text();
                color = output.getAttr('color');
                connector = output;
            }
            if(target.hasName('input')){
                self._startType = 'INPUT';
                color = 'white';
                connector = target;
            }
            const startPosition = {
                x: group.x() + connector.x(),
                y: group.y() + connector.y()
            }
            self._actualLine = new Konva.Line({
                                                  stroke: color,
                                                  listening: false,
                                                  points: [startPosition.x , startPosition.y, pointerPosition.x, pointerPosition.y]
                                              });
            self._layer.add(self._actualLine);
            self._actualLine.moveToBottom();
        })
        // update line
        stage.on('mousemove', function (e){
            const target = e.target;
            // basic visualisation for the connectors
            if(target.hasName('output') || target.hasName('input') || target.hasName('outputText')){
                self.selectConnector(target);
                layer.batchDraw();
            }else if(self._hoveredConnector) {
                self.unselectConnector();
                layer.batchDraw();
            }else if(target.hasName('connection')){
                stage.container().style.cursor = 'pointer';
            }else if(stage.container().style.cursor === 'pointer'){
                stage.container().style.cursor = self._layerDragPlugin._enabledDragMode ? 'grab' : 'default';
            }
            // update line
            if(self._drawingLine && self._actualLine){
                const pos = EditorUtils.getRelativePointerPosition(self._stage);
                const points = self._actualLine.points().slice();
                points[2] = pos.x;
                points[3] = pos.y;
                self._actualLine.points(points);
                self._layer.batchDraw();
            }

        })
        // create connection if possible
        stage.on('mouseup touchend', function(e){
            if(!self._drawingLine){
                return;
            }
            const target = e.target;
            const group = target.getParent();
            let connectionHistory = undefined;
            self._drawingLine = false;
            self._startItem.draggable(true);

            if(group && group !== self._startItem){
                if(self._startType === 'OUTPUT' && group.hasName('object')){
                    connectionHistory = self.createConnection(new Connection(self._startItem.id(),group.id(), self._outputName));
                }else if(self._startType === 'INPUT'){
                    if(target.hasName('output')){
                        connectionHistory = self.createConnection(new Connection(group.id(), self._startItem.id(), target.id()));
                    }else if(target.hasName('outputText')){
                        connectionHistory = self.createConnection(new Connection(group.id(), self._startItem.id(),target.text()));
                    }
                }
                if(connectionHistory){
                    // TODO add redo undo for grouping plugin
                    //const historyElements = [self._preSelectedElementHistory,  connectionHistory];
                    //self._history.addStateHistory( self._preSelectedElementHistory.attrs.uuids.length > 0 ? historyElements : [connectionHistory])
                    self._history.addStateHistory([connectionHistory])
                }
            }
            self._actualLine ? self._actualLine.destroy() : '';
            self._startItem = undefined;
            self._outputName = undefined;
            self._actualLine = undefined;
            layer.batchDraw();
        })

        layer.on('dragmove', e => {
            const target = e.target;
            if(target.hasName('object')){
                self.redrawConnectionsByTarget(target);
            }
        });
    }
    removeAll(){
        this._connections = [];
    }
    getAllConnections(){
        return this._connections.map(connection => new Connection(connection.fromId, connection.toId, connection.outputname));
    }
    addHistoryHandler(historyHandler){
        this._history = historyHandler;
    }
    addLayerPlugin(layerPlugin){
        this._layerDragPlugin = layerPlugin;
    }
    addGroupingPlugin(groupingPlugin){
        this._groupingPlugin = groupingPlugin;
    }
    redrawConnectionsByTarget(target){
        this._connections.filter(o => o.from === target || o.to === target).forEach((connection) => {
            this.redrawConnection(connection)
        })
    }
    redrawAllConnections(){
        this._connections.forEach((connection) => {
            this.redrawConnection(connection)
        })
    }
    updateConnectionRefs(outputWithBeforeNames){
        console.log(outputWithBeforeNames);
        this._connections.forEach(line => {
            line.from = this._layer.findOne('#' + line.fromId);
            line.to = this._layer.findOne('#' + line.toId);
            if(outputWithBeforeNames){
                if(line.fromId.split('$')[0] === outputWithBeforeNames.uuid){
                    const output = outputWithBeforeNames.outputs.filter(o => o.before === line.outputname);
                    if(output && output.length > 0){
                     line.outputname = output[0].name;
                    }
                }
            }
            const output = line.from.findOne('#' + line.outputname);
            if(output){
                line.line.stroke(output.getAttr('color'))
            }

        })
    }
    redrawConnection(connection){
        const line = connection.line;
        const x1 = connection.from.position().x + connection.from.findOne('#' + connection.outputname).position().x;
        const y1 = connection.from.position().y + connection.from.findOne('#' + connection.outputname).position().y;
        const x2 = connection.to.position().x + connection.to.findOne('.input').position().x;
        const y2 = connection.to.position().y + connection.to.findOne('.input').position().y;
        const xHalf = Math.ceil(x1+ ((x2-x1)/2));
        line.points([x1,y1,xHalf,y1,xHalf, y2,x2,y2]);
        line.moveToBottom();
    }
    createConnection(connectionToCreate){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const startElement = self._layer.findOne('#' +connectionToCreate.fromId);
        const endElement = self._layer.findOne('#' +connectionToCreate.toId);
        if(!startElement || !endElement){
            console.log('Start or endelement not found');
            return;
        }
        const connectionIntersections = self._connections.filter(connection => (connection.outputname === connectionToCreate.outputname && connection.fromId === startElement.id()));
        if(connectionIntersections){
            connectionIntersections.forEach(connection => {self.removeConnectionById(connection.uuid1)})
        }

        const x1 = startElement.position().x + startElement.findOne('#' + connectionToCreate.outputname).position().x;
        const y1 = startElement.position().y + startElement.findOne('#' + connectionToCreate.outputname).position().y;
        const x2 = endElement.position().x + endElement.findOne('.input').position().x;
        const y2 = endElement.position().y + endElement.findOne('.input').position().y;
        const color = startElement.findOne('#' + connectionToCreate.outputname).getAttr('color');
        const xHalf = Math.ceil(x1+ ((x2-x1)/2));
        const uuid1 = connectionToCreate.uuid1 ? connectionToCreate.uuid1: EditorUtils.uuidv1();
        const line = new Konva.Line({
                                        stroke: color,
                                        listening: true,
                                        name: 'connection',
                                        shadowColor: 'white',
                                        shadowBlur: 10,
                                        shadowOffset: { x: 1, y: 1 },
                                        shadowOpacity: 0,
                                        strokeWidth: 2,
                                        hitStrokeWidth: 20,
                                        id: uuid1,
                                        bezier: true,
                                        points: [x1,y1,xHalf,y1,xHalf,y2,x2,y2]
                                    });
        self._layer.add(line);
        line.moveToBottom();
        self._layer.draw();
        const internalLine = new InternalConnection(startElement, startElement.id(), endElement, endElement.id(), connectionToCreate.outputname, line, uuid1);
        this._connections.push(internalLine);
        return new HistoryStateElement(self.createConnection.bind(self), internalLine, self.removeConnectionById.bind(self), uuid1);
    }
    getOutputText(outputConnector){
        const outputname = outputConnector.id();
        const outputs = outputConnector.getParent().find('.outputText').toArray();
        for(let i = 0; i < outputs.length; i++){
            if(outputs[i].text() === outputname){
                return outputs[i]
            }
        }
    }
    getOutputConnector(parent, id){
        return parent.findOne('#' + id);
    }
    getConnectionsBetween(objects){
      const objectIds = objects.map(object => object.id());
      const linesBetween = [];
      this._connections.forEach(connection =>{
          if(objectIds.includes(connection.fromId) && objectIds.includes(connection.toId)){
              linesBetween.push(new Connection(connection.fromId, connection.toId, connection.outputname));
          }
      })
      return linesBetween;
    }
    selectConnector(target){
        if(this._hoveredConnector && target !== this._hoveredConnector){
            this.unselectConnector()
        }
        const hoverColor = vuetify.framework.theme.themes[store.state.theme.darkMode ? 'dark' : 'light'].primaryText;
        if(target.hasName('output')){
            const outputText = this.getOutputText(target);
            if(outputText){
                outputText.setAttr('fill', hoverColor);
                this._hoveredText = outputText;
            }
            this._hoveredConnector = target;
            this._stage.container().style.cursor = 'pointer';
            target.setAttr('fill', hoverColor);
        }else if(target.hasName('outputText')){
            const connector = this.getOutputConnector(target.getParent(), target.text());
            if(connector){
                this._hoveredConnector = connector;
                connector.setAttr('fill', hoverColor);
            }
            this._hoveredText = target;
            this._stage.container().style.cursor = 'pointer';
            target.setAttr('fill', hoverColor);
        }else{
            this._hoveredConnector = target;
            this._stage.container().style.cursor = 'pointer';
            target.setAttr('fill', hoverColor);
        }
    }
    unselectConnector(){
        this._hoveredConnector.setAttr('fill', '#82B1FF');
        if(this._hoveredText){
            this._hoveredText.setAttr('fill', '#82B1FF');
            this._hoveredText = undefined;
        }
        this._stage.container().style.cursor = 'default';
        this._hoveredConnector = undefined;
    }
    selectConnection(target){
        if(this._selectedConnectionId){
            this.unselectConnection();
        }
        this._selectedConnectionId = target.id();
        target.setAttr('shadowOpacity', 1);
        target.setAttr('strokeWidth', 5);
    }
    unselectConnection(){
        if(this._selectedConnectionId){
            const connection = this._connections.filter(o => o.line.id() === this._selectedConnectionId);
            if(connection && connection.length > 0) {
                connection[0].line.setAttr('strokeWidth', 2)
                connection[0].line.setAttr('shadowOpacity', 0);
            }
            this._selectedConnectionId = undefined;
        }
    }
    clearConnections(){
        const connectionHistory = [];
        this._connections.forEach((connection) => {
            const from = this._layer.findOne(node => {return node.parent.getType() === 'Layer' && node.id() === connection.from.id()});
            const to = this._layer.findOne(node => {return node.parent.getType() === 'Layer' && node.id() === connection.to.id()});
            if(!from || !to){
                const removedConnectionHistory = this.removeConnectionById(connection.line.id())
                if(removedConnectionHistory){
                    connectionHistory.push(removedConnectionHistory);
                }
            }
        })
        return connectionHistory;
    }
    removeConnectionById(uuid1){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        let historyState = undefined;
        if(uuid1){
            for(let i = 0; i < self._connections.length; i++){
                if(self._connections[i].uuid1 === uuid1){
                    const connection = this._connections[i];
                    historyState = new HistoryStateElement(self.removeConnectionById.bind(self), uuid1, self.createConnection.bind(self), new Connection(connection.fromId, connection.toId, connection.outputname, uuid1))
                    if(this._selectedConnectionId === uuid1){
                        this.unselectConnection()
                    }
                    this._connections[i].line.destroy();
                    this._connections[i].line = undefined;
                    self._layer.draw();
                    self._connections = self._connections.filter(o => o.line);
                    break;
                }
            }
        }
        return historyState;
    }
    setHistory(attrs){
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        const toRemove = self._layer.findOne('#' + attrs.uuid1);
        if(toRemove){
            self.removeConnectionById(attrs.uuid1);
        }else{
            const from = self._layer.findOne('#' + attrs.from);
            const to = self._layer.findOne('#'+attrs.to);
            if(from && to){
                const lineObject = self.createConnection(from, attrs.outputname, to, attrs.uuid1)
                if(attrs.select){
                    self._groupingPlugin.unselectAll();
                    self.selectConnection(lineObject.line);
                }
            }
        }
        self._layer.draw();
    }
}