import { LINE_SPLIT_REGEX } from './Utils';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';

/**
 * Helpclass to extract Elements and Behaviors from a .dsd-file
 */

export default class DSDParser {

    /**
     * Searching for a Subtree or Behaviortree by identifier
     *
     * @param file: String      filecontent
     * @param identifier
     * @returns  topologie: {name: string, element: {outputs: topologie[], name: string}}
     */
    parseDsd(file, identifier){
        const response = this.getTopologie(file, identifier);         // removing first line which just contain the identifier
        if(response.topologie) {
            return {
                name: response.name,
                topologie: this.parseElement(response.topologie)
            }
        }
        return undefined;
    }
    // compare(beforeFile, afterFile){
    //     const changedBehaviors = [];
    //     let actualBlock= "";
    //     const splittedBefore = beforeFile.split(LINE_SPLIT_REGEX);
    //     const splittedAfter = afterFile.split(LINE_SPLIT_REGEX);
    //     for(let i =0; i < splittedBefore.length && i < splittedAfter.length; i++){
    //         if(splittedBefore[i].startsWith('#') || splittedBefore[i].startsWith('-->')){
    //
    //         }
    //     }
    // }
    /**
     * Extract Topologie from File
     *
     * @param file
     * @param identifier
     * @returns {{name: string, topologie: []}|undefined}
     */
    getTopologie(file, identifier){
        const lines = file.split(LINE_SPLIT_REGEX);
        let startLine = 0;
        let offset = "";
        const topologie = [];
        let name = "";
        for(let i = 0; i < lines.length; i++) {

            if (lines[i].startsWith(identifier)) {
                const splitted = lines[i].split(identifier.startsWith('#') ? '#' : '-->');
                offset = splitted[0];
                if(splitted.length > 1){
                    name = splitted[1];
                }
                if(i < lines.length-1 && lines[i+1].includes('$')){         // validate startet Topologie
                    startLine = i+1;
                    topologie.push(lines[i+1]);
                }
                break;
            }
        }
        if(topologie.length > 0) {
            for (let i = startLine + 1; i < lines.length; i++) {
                if (lines[i].startsWith(offset + '    ') || lines[i] === "") {
                    topologie.push(lines[i]);
                } else {
                    break;
                }
            }
        }else{
            return undefined;
        }
        return {name, topologie};
    }

    /**
     * Parse Element from Topologie
     * recrusive
     * @param lines: Topologie
     * @returns {{outputs: [], name: {name: string, element: {outputs: [], name: string}}}}
     */
    parseElement(lines){
        const offset = lines[0].length - lines[0].trimLeft().length; //calculate Offset of actual Codeblock
        let name = lines[0].trimLeft();                             // name of the actual codeblock
        let outputName = "";
        let isOutput = false;
        if(name.includes('-->')){                                                   // if name is template $outputname$ --> $elementname$
            const tmp = name.split('-->');
            outputName = tmp[0].trim();                                             // parse outputname
            name = tmp[tmp.length-1].replace(/ /g, '');        // parse name of new block
            isOutput = true;                                                       // actual codeblock is result of an output
        }
        if(lines && lines.length > 1){
            const outputs = [];
            let actualOutput= [];
            for(let i = 1; i < lines.length; i++){
                const ownOffset = lines[i].length - lines[i].trimLeft().length;     //calculate offset of new block
                if(ownOffset === offset+4 && actualOutput.length > 0){              //new output starts
                    outputs.push(this.parseElement(actualOutput));
                    actualOutput = [];
                }
                if(lines[i].trim() !== ""){
                    actualOutput.push(lines[i]);
                }
            }
            if(actualOutput.length > 0){
                outputs.push(this.parseElement(actualOutput));
            }
            // outputs now contains all outputnames with the element that stick on it
            if(isOutput){
                return {name: outputName, element: {name, outputs}};
            }else{
                return {name, outputs};
            }
        }else{
            //lines just contains a single line => need to be a single action, action sequenze or a subtree
            if(isOutput){
                return {name: outputName, element: {name: name}}
            }
        }
    }

    createDsdBlock(instance, name){
        let lines = [];
        let identifier;
        let complete = true;
        if(instance.isBehaviorTree){
            identifier = '-->' + name;
        }else{
            identifier = '#' + name;
        }
        lines.push(identifier);
        const entryNode = instance.entryNode;
        const followElement = this.getFollowingNode(entryNode, 'start', instance.connections, instance.nodes);
        if(followElement){
            const response = this.createBlock(followElement, instance.connections, instance.nodes)
            lines = lines.concat(response.lines);
            if(complete){
                complete = response.complete
            }
        }else {
            return undefined;
        }
        return {isBehaviorTree: instance.isBehaviorTree, block: lines.join('\n'), complete};
    }

    createBlock(node, connections, nodes){
        const offset = '    ';
        const lines = [];
        let complete= true;
        lines.push(this.createStartLine(node))
        node.customItem.outputs.forEach(output => {
            const followingElement = this.getFollowingNode(node, output.name, connections, nodes);
            if(followingElement){
                const response = this.createBlock(followingElement, connections, nodes);
                if(!response.complete){
                    complete = false;
                }
                lines.push(offset + output.name + ' --> ' + response.lines[0]);
                response.lines.shift(); // removing startline
                response.lines.forEach(line => {
                    lines.push(offset + line);
                })
            }else{
                complete = false;
            }
        })
        return {lines, complete};
    }
     createStartLine(node){
        const prefix = this.getPrefix(node);
        let line = '';
        let parameters = '';
        if(node.customAttr.parameters && node.customAttr.parameters.length > 0){
            // Add parameters to line;
            node.customAttr.parameters.forEach(parameter => {
                parameters += ' + ' + parameter.name + ':' + parameter.value;
            })

        }
        line = prefix + node.customItem.name + parameters;
        if(node.periode){
            line += ', ' + this.createStartLine(node.periode);
        }
        return line;
    }
    getFollowingNode(node, outputname, connections, nodes){
        const connectionFromOutput = connections.filter(connection =>  connection.fromId === node.customItem.uuid + '$' + node.uuid1 && outputname === connection.outputname);
        if(connectionFromOutput && connectionFromOutput.length > 0){
            return this.findNodeByUUID(connectionFromOutput[0].toId, nodes);
        }
        return undefined;
    }
    findNodeByUUID(uuid, nodes){
        const result = nodes.filter(node => (node.customItem.uuid + '$' + node.uuid1) === uuid);
        if(result && result.length > 0){
            return result[0];
        }
        return undefined
    }
    getPrefix(node){
        switch (node.customItem.type){
            case ELEMENT_TYPE.DECISION:
                return '$';
            case ELEMENT_TYPE.ACTION:
                return '@';
            default:
                return '#'
        }
    }
}