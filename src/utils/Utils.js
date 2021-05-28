import Node from '@/entities/Node';
import Element from '@/entities/Element';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';
import UUIDv4Generator from '@/utils/UUIDv4Generator';
import Output from '@/entities/Editor/Output';
import EditorUtils from '@/plugins/canvas/EditorUtils';

/**
 *   Global constants
 *
 */

export const IGNORED_FILES = ['__init__.py'];                       //Ingored files
export const IGNORED_CLASS_PREFIXES = ['Abstract', 'abtract'];      //Ingored Classes

// Regex for FileParser
export const CLASS_NAME_REGEX = /class \w+/g
export const CLASS_NAME_REGEX_OFFSET = 6
export const LINE_SPLIT_REGEX = /\r?\n/
export const REGEX_PYTHON_CLASS_COMMENT = /"{3}([\s\S]*?"{3})/g

// Python class comments prefixes
export const DSD_UUID_PREFIX = ':dsd-uuid: '
export const DSD_PARAM_PREFIX = ':dsd-param '
export const DSD_RETURN_PREFIX = ':dsd-return: '
export const DSD_COLOR_PREFIX = ':dsd-colors: '

export default class  Utils{

    /**
     * Returns the directory speator
     * Need to be changed manually, depending on the system
     *
     * Linux: /
     * Windows: \
     *
     * @returns {string}    Local directory separator
     */
    static getDir(){
        return '/';
    }

    /**
     * Returns the ending of the config file for the programm
     *
     * @returns {string}   Ending of the config file
     */
    static getConfigType(){
        return 'dsdui';
    }

    /**
     * Creating an entry Element for the Editor
     *
     * @param name              Name of the entryElement (Name of the instance)
     * @param dsdFile: File     File where the instance is saved (normally the .dsd file)
     * @returns Node
     */
    static createEntry(name, dsdFile){
        const node = new Node()
        node.customItem =new Element(name, ELEMENT_TYPE.ENTRY, dsdFile, UUIDv4Generator.uuidv4(),  [new Output('start', '#ffffff')], undefined);
        node.uuid1 = EditorUtils.uuidv1();
        node.position= {x:0,y:0}
        return node;
    }
}