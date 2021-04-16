import store from '@/store/index';
import Utils, { DSD_COLOR_PREFIX, DSD_PARAM_PREFIX, DSD_RETURN_PREFIX, DSD_UUID_PREFIX, LINE_SPLIT_REGEX, REGEX_PYTHON_CLASS_COMMENT } from '@/utils/Utils';
import Parameter from '@/entities/Editor/Parameter';
import Output from '@/entities/Editor/Output';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';
import Element from '@/entities/Element';
import UUIDv4Generator from '@/utils/UUIDv4Generator';

/**
 * Helpclass to parse pyhton Files
 * Extract classcomments
 *
 *
 */
export default class FileParser{

    /**
     * Extract an Element from the ClassComment
     *
     * @param fileContent
     * @param treeElement
     * @param parent
     * @param className
     * @returns {undefined|Element}
     */
    parseElement(fileContent, treeElement, parent, className){
        const elementType = this.getElementTypeByPath(parent.object.path);
        const blockInformations = this.getBlock(fileContent, 'class ' + className);
        if(blockInformations){
            const classComment = this.getClassComment(blockInformations.block);

            const parameters = this.getParameterByComment(classComment);
            let outputs = this.getValuesByComment(classComment, DSD_RETURN_PREFIX);
            const outputcolors = this.getValuesByComment(classComment, DSD_COLOR_PREFIX);
            let uuid = this.getUUID(classComment);
            if (outputs) {
                const tempraryOutputs = []
                for (let i = 0; i < outputs.length; i++) {
                    let color = this.getDefaultOutputColor();
                    if (outputcolors && outputcolors.length > i) {
                        color = outputcolors[i];
                    }
                    tempraryOutputs.push(new Output(outputs[i], color))
                }
                outputs = tempraryOutputs;
            } else {
                outputs = [];
            }
            const parentWithoutChilds = Object.assign({}, parent);
            parentWithoutChilds.children = [];
            uuid = uuid ? uuid : UUIDv4Generator.uuidv4();
            const newElement = new Element(className, elementType, parentWithoutChilds, uuid, outputs,parameters);
            return newElement;
        }
        return undefined
    }

    /**
     * Parsing a element into a classcomment
     *
     * @param file           File where the classcomment has to be replaced or created
     * @param element        element that needs to be parsed
     * @returns String       Return the file content
     */
    updateElementComment(file, element){
        const blockInformations = this.getBlock(file, 'class ' + element.name);
        let classComment = this.getClassComment(blockInformations.block);
        // set id
        classComment = this.setUUID(classComment, element.uuid);
        // set outputs
        if(element.outputs.length > 0){
            classComment = this.setValues(classComment, element.outputs.map(o => o.name), DSD_RETURN_PREFIX);
            classComment = this.setValues(classComment, element.outputs.map(o => o.color), DSD_COLOR_PREFIX)
        }
        // set params
        if(element.parameters && element.parameters.length > 0){
            classComment = this.setParameters(classComment, element.parameters);
        }
        const updatedClassBlock = this.setClassComment(blockInformations.block, classComment);
        return this.replaceBlock(file, blockInformations.startLine, blockInformations.endLine, updatedClassBlock);
    }


    /**
     * Returns information about the section which starts with {identifier}
     *
     * @param {string} fileContent
     * @param {string} identifier
     * @returns {{endLine: number, offset: string, startLine: number, block: []}|undefined}
     */
    getBlock(fileContent, identifier){
        const outterBlock = fileContent.split(LINE_SPLIT_REGEX);
        let startLine = 0;
        let endLine = -1;
        let offset = "";
        const block = [];
        for(let i = 0; i < outterBlock.length; i++) {

            if (outterBlock[i].includes(identifier)) {
                const splitted = outterBlock[i].split(identifier);
                startLine = i;
                offset = splitted[0];
                block.push(outterBlock[i]);
                break;
            }
        }
        if(block.length > 0) {
            let firstFunctionFound = false;
            for (let i = startLine + 1; i < outterBlock.length; i++) {
                if(outterBlock[i].includes('def ')){
                    firstFunctionFound = true;
                }

                if (outterBlock[i].startsWith(offset + '    ') || outterBlock[i] === "" || !firstFunctionFound) {
                    block.push(outterBlock[i]);
                } else {
                    endLine = i-1;
                    break;
                }
            }
        }else{
            return undefined;
        }
        if(!endLine){
            endLine = outterBlock.length-1;
        }
        return {startLine, endLine, offset, block};
    }

    /**
     * Return Classcomment of a block
     * @param {string[]} block
     * @returns {string}    classcomment without """ at the beginning and end
     */
    getClassComment(block){
        const joinedBlock = block.join('\n').split('def ');

        if(joinedBlock.length > 0){
            const matches = joinedBlock[0].match(REGEX_PYTHON_CLASS_COMMENT);
            if(matches){
                let comment = matches[0].replace('"""', '');
                comment = comment.substring(0, comment.length-3)
                //console.log(comment);
                return comment;
            }
        }
        return "";
    }

    /**
     * Returns all Parameter that are saved in the Comment
     *
     * @param comment
     * @returns {[{name: string, value: string}]}
     */
    getParameterByComment(comment){
        // TODO no value can be saved in the file
        const parameters= [];

        const regex = new RegExp(DSD_PARAM_PREFIX + ".*", 'g');
        const matches = comment.match(regex);
        if(matches){
            for(let i = 0; i < matches.length; i++){
                const rohParam = matches[i].substring(DSD_PARAM_PREFIX.length, matches[i].length);
                const splittedParam = rohParam.split(': ');
                if(splittedParam.length >= 1) { // only name exist
                    parameters.push(new Parameter(splittedParam[0], undefined))
                }
            }
        }
        return parameters;
    }

    /**
     * Return all values that are correspond to the prefix
     *
     * @param comment   String to search for the regex
     * @param prefix    Regex prefix
     * @returns {string[] |undefined}
     */
    getValuesByComment(comment, prefix){
        const regex = new RegExp(prefix + ".*");
        const matches = comment.match(regex);
        if(matches){
            let match = matches[0];
            match = match.substring(prefix.length, match.length).replace(/'/g, '').replace(/ /g, '').replace(/"/g, '');
            return match.split(',');
        }
        return undefined;
    }

    /**
     * Returns the uuid which is included in the comment
     *
     * @param comment   String to search the zzud
     * @returns {string|undefined}
     */
    getUUID(comment){
        const regex = new RegExp(DSD_UUID_PREFIX + ".*");
        const matches = comment.match(regex);
        if(matches){
            const match = matches[0].split("'");
            if(match.length > 0){
                return match[1];
            }
        }
        return undefined;
    }

    /**
     * Replace or Add UUID
     *
     * @param comment
     * @param uuid
     * @returns {string|*}
     */
    setUUID(comment, uuid){
        //const tmp = comment.split(LINE_SPLIT_REGEX);
        //const offset = tmp[tmp.length-1].length - tmp[tmp.length-1].trimLeft().length;
        const offset = 4;
        const uuidString = DSD_UUID_PREFIX  + "'" + uuid + "'";
        if(this.getUUID(comment)){
            const regex = new RegExp(DSD_UUID_PREFIX + ".*");
            return comment.replace(regex, uuidString);
        }else{
            return this.addCommentLine(comment, ' '.repeat(offset)  +uuidString);
        }
    }

    /**
     * Replace or add Value to classcomment
     * @param comment: String
     * @param values: String[]
     * @param prefix: REGEX
     * @returns String
     */
    setValues(comment, values, prefix){
        const regex = new RegExp(prefix + ".*");
        const offset = 4;
        //const tmp = comment.split('\n');
        // if(tmp){
        //     offset = tmp[tmp.length-1].length - tmp[tmp.length-1].trimLeft().length
        // }
        let outputString = prefix;
        for(let i = 0; i < values.length; i++){
            outputString +=  values[i];
            if(i < values.length-1){
                outputString += ', '
            }
        }
        if(this.getValuesByComment(comment, prefix)){
            return comment.replace(regex, outputString);
        }else {
            return this.addCommentLine(comment, ' '.repeat(offset) + outputString)
        }

    }

    /**
     * Adding Classcomment to block
     * @param block
     * @param comment
     * @returns String[]
     */
    setClassComment(block, comment){
        const joinedBlock = block.join('\n').split('def ');
        if(joinedBlock.length > 0){
            const regex = REGEX_PYTHON_CLASS_COMMENT;     //regex for python classComment block
            if(joinedBlock[0].match(regex)){
                joinedBlock[0] = joinedBlock[0].replace(regex, '"""' + comment+ '\n    """');
            }else{
                // no comment exist
                const tmp = joinedBlock[0].split('\n');
                const offset = tmp[tmp.length-1].length - tmp[tmp.length-1].trimLeft().length;
                joinedBlock[0] += '"""\n' + comment+ '"""\n' + ' '.repeat(offset);
            }
            block = joinedBlock.join('def ').split('\n');
        }
        return block;

    }

    /**
     * Replacing a Block
     *
     * @param file: String      FileContent
     * @param startLine: Number Startline where replacing starts
     * @param endLine: Number   Endling where replacing ends
     * @param block             Block that get pasted
     * @returns String          new Filecontent
     */
    replaceBlock(file, startLine, endLine, block){
        const outterBlock = file.split(LINE_SPLIT_REGEX);
        const fileBevorBlock = outterBlock.slice(0, startLine);
        const fileAfterBlock = outterBlock.slice(endLine, file.length-1);
        return fileBevorBlock.concat(block).concat(fileAfterBlock).join('\n');
    }

    /**
     * Adding the parameter into the comment
     *
     * @param comment: String
     * @param parameters: Parameter[]
     * @returns string
     */
    setParameters(comment, parameters){
        let innercomment = comment;
        const regexOne = new RegExp(DSD_PARAM_PREFIX + ".*", 'g');
        const regexTwo = new RegExp(DSD_PARAM_PREFIX + ".*\n", 'g');
        // const tmp = comment.split(LINE_SPLIT_REGEX);
        const offset = 4;
        // if(tmp){
        //     offset = tmp[tmp.length-1].length - tmp[tmp.length-1].trimLeft().length
        // }
        innercomment = innercomment.replace(regexOne, '');
        innercomment = innercomment.replace(regexTwo, '');
        let result = innercomment;
        for(let i = 0; i < parameters.length; i++){
            const paramLine = ' '.repeat(offset) + DSD_PARAM_PREFIX + parameters[i].name + '' ;
            result = this.addCommentLine(result, paramLine);
        }
        return result;
    }
    addCommentLine(comment, line){
        return comment + '\n' + line;
    }
    /**
     * Returning the default Color for the outputs depending on the theme
     *
     * @returns {string}
     */
    getDefaultOutputColor(){
        //TODO change with variables from vuetify
        return store.state.theme.darkMode ? '#474747' : '#e0e7e3'
    }

    /**
     * Returns the Elementtyp depending on the folder that contain the file
     *
     * @param path
     * @returns {string|undefined}
     */
    getElementTypeByPath(path){
        if(path.includes(Utils.getDir() + 'actions' +  Utils.getDir())){
            return ELEMENT_TYPE.ACTION
        }else if(path.includes(Utils.getDir() + 'decisions' +  Utils.getDir())) {
            return ELEMENT_TYPE.DECISION
        }else if(path.endsWith('.dsd')){
            return ELEMENT_TYPE.SUBTREE
        }
        return undefined;
    }

}