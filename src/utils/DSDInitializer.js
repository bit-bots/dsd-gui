import DSDParser from './DSDParser';
import FileController from '../controller/FileController';
import Utils from './Utils';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';
import Node from '@/entities/Node';
import Output from '@/entities/Editor/Output';
import Connection from '@/entities/Editor/Connection';
import EditorUtils from '@/plugins/canvas/EditorUtils';
import Parameter from '@/entities/Editor/Parameter';


export default class DSDInitializer{
    // TODO
    // if dsd file changed but project already importet it doesn't get recognized

    constructor( projectController, konvaEditor) {
        this._projectController = projectController;
        this._konvaEditor = konvaEditor;
    }


     initializeWithoutExistingConfig(dsdFile, identifier, name){
         const dsdFileContent = FileController.loadFile(dsdFile.path);
         const dsdParser = new DSDParser();
         const response = dsdParser.parseDsd(dsdFileContent, identifier);
         const parsedDsd = response.topologie;
         let instanceName = response.name;
         if(!instanceName || instanceName === ""){
             instanceName = dsdFile.name;
         }
         const entry = Utils.createEntry(instanceName, dsdFile)
         const instaceConfig = this.generateInstanceConfig(parsedDsd, entry, 'start');
         instaceConfig.entryNode = entry;
         this.initializeWithExistingConfig(instaceConfig)
         return instaceConfig;

    }
    initializeWithExistingConfig(instanceConfig){
        const nodes = instanceConfig.nodes.filter(node => node.customItem.type !== ELEMENT_TYPE.ENTRY);
        const connections = instanceConfig.connections;
        const entryNode = instanceConfig.entryNode;
        this._konvaEditor.createElement(entryNode);
        for(let i = 0; i < nodes.length; i++) {
            const actualNode = nodes[i];
            const correspondendingTreeElement = this._projectController.getTreeElementByElement(actualNode.customItem)
            if(correspondendingTreeElement){
                actualNode.customItem = correspondendingTreeElement.object;
            }else{
                actualNode.error = true;
            }
            this._konvaEditor.createElement(actualNode);
        }
        for(let i = 0; i < connections.length; i++){
            this._konvaEditor.createConnection(connections[i]);
        }
    }

    /** Extract all Nodes and connections form the DSD
     *
     * @param parsedDsd                 parsed dsd
     * @param entryElement              Start Element from the dsd
     * @param ignoreParentElement       loopingvariable
     * @returns {Instance}
     */
    generateInstanceConfig(parsedDsd, parentNode, output){
        let nodes = [];
        let connections = [];
        const node = this.createNode(parsedDsd);        // new created Node correct
        if(node){
            connections.push(new Connection(parentNode.customItem.uuid + '$' + parentNode.uuid1,
                                            node.customItem.uuid + '$' + node.uuid1,
                                            output))           // connection between
            if(parsedDsd.outputs){      // there are outputs from the node
                for(let i =0; i < parsedDsd.outputs.length; i++){
                    if(parsedDsd.outputs[i].element){
                        const result = this.generateInstanceConfig(parsedDsd.outputs[i].element, node, parsedDsd.outputs[i].name);
                        nodes = nodes.concat(result.nodes);
                        connections = connections.concat(result.connections);
                    }
                }
            }
            nodes.push(node);
        }
        return {nodes, connections};
    }
    createNode(parsedDsd){
        let elementName = parsedDsd.name.substring(1);
        let periode = undefined;
        if(elementName.includes(',')){
            const index = elementName.indexOf(',');
            periode = this.createNode({name: elementName.slice(index+1)})
            elementName = elementName.slice(0, index);
        }
        const parameters = [];
        if(elementName.includes('+')){
            const splitted = elementName.split('+');
            elementName = splitted[0];
            splitted.shift();
            for(let i = 0; i< splitted.length; i++){
                const rohParameter = splitted[i].split(':')
                if(rohParameter.length === 2){
                    parameters.push(new Parameter(rohParameter[0], rohParameter[1]));
                }else{
                    parameters.push(new Parameter(rohParameter[0]));
                }
            }
        }
        const node = new Node();
        const identifier = parsedDsd.name.substring(0,1);
        const outputs = parsedDsd.outputs ? [...parsedDsd.outputs].map(o => new Output(o.name, '#ffffff')) : []; //todo default color

        const possibleTreeElement = this._projectController.getTreeElementByName(elementName, identifier);
        if (possibleTreeElement){
            node.customItem = possibleTreeElement.object;
            if(!node.customItem.outputs || node.customItem.outputs.length === 0){
                node.customItem.outputs = outputs;
            }
            if(!node.customItem.parameters || node.customItem.parameters.length === 0){
                node.customItem.parameters = parameters;
            }
            node.customAttr = {parameters}
            node.periode = periode;
            node.uuid1 = EditorUtils.uuidv1();
            node.position= {x:0, y:0}
            return node;
        }else{
            return undefined;
        }
    }

}