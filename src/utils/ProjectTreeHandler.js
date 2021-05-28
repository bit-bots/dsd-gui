import FileController from '../controller/FileController';
import TreeElement from '@/entities/TreeElement';
import { TREE_TYPE } from '@/enumerates/TreeType';
import store from '@/store/index';
import Utils, { CLASS_NAME_REGEX, CLASS_NAME_REGEX_OFFSET, IGNORED_CLASS_PREFIXES, IGNORED_FILES, LINE_SPLIT_REGEX } from '@/utils/Utils';
import FileParser from '@/utils/FileParser';
import Element from '@/entities/Element';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';
import File from '@/entities/File';

/**
 * Includes all functions for the projectTree to interact with the projectTree
 */

export default class ProjectTreeHandler{

    constructor() {
        this.fileParser = new FileParser();
    }

    /**
     * Creating the Projecttree
     * ProjectConfiguration and projectConfigurationLocal need to be stored in vuex
     *
     * @returns TreeElement[]
     */
    loadProjectTree(){
        const localConfig = store.state.projectConfigurationLocal;
        const config = store.state.projectConfiguration;
        const projectTree = [];
        const topLayerFilePaths = [];
        topLayerFilePaths.push(localConfig.path + Utils.getDir() + 'actions');
        topLayerFilePaths.push(localConfig.path + Utils.getDir() + 'decisions');
        topLayerFilePaths.push(localConfig.path + Utils.getDir() + config.behaviorModuleName);
        topLayerFilePaths.push(localConfig.path + Utils.getDir() + config.dsdFileName);
        topLayerFilePaths.push(localConfig.blackboardPath);
        topLayerFilePaths.forEach(path => {
            if(!path || !FileController.existFile(path)) {
                return;
            }
            const file = FileController.fileInfo(path);
            const treeElement = this.createTreeElementByFile(file);
            if(treeElement.type === TREE_TYPE.DIRECTORY){
                treeElement.children = this.loadAllElements(treeElement.object.path, treeElement.object.path !== localConfig.path);
            }
            projectTree.push(treeElement);
        })
        // Loading the virtuell Folder for Subtrees
        const subtreeFolderFile = new File(localConfig.path + Utils.getDir() + 'subtrees', 'subtrees', '', true)     // need to be create manuale because it does not exist in reality
        const subtreeTreeElement = this.createTreeElementByFile(subtreeFolderFile);
        subtreeTreeElement.children = this.loadAllSubtrees(subtreeTreeElement)
        projectTree.splice(2,0,subtreeTreeElement);

        return projectTree;
    }

    /**
     * Loading all Subtrees
     * projectConfiguration and projectConfigurationLocal need to be stored in vuex
     *
     * @param subtreeDirectory: TreeElement     TreeElement where the subtrees need to be added
     * @returns TreeElement[]
     */
    loadAllSubtrees(subtreeDirectory){
        const localConfig = store.state.projectConfigurationLocal;
        const config = store.state.projectConfiguration;
        const file = FileController.loadFile(localConfig.path + Utils.getDir() + config.dsdFileName);
        const lines = file.split(LINE_SPLIT_REGEX)
        const matches = lines.filter(o => o.replace(/ /g, '').startsWith('#'))
        const subtrees = [];
        for(let i = 0; i < matches.length; i++){
            const tmp = matches[i].replace(/ /g, '');
            const name = tmp.slice(1, tmp.length)
            const element = this.createSubtreeTreeElement(subtreeDirectory, name);
            subtrees.push(element)
        }
        return subtrees
    }

    /**
     * Creating Subtree by Name
     *
     * @param subtreeDirectory          Parentelement of the subtree
     * @param name                      Name of the Subtree
     * @returns TreeElement
     */
    createSubtreeTreeElement(subtreeDirectory, name){
        const element = this.createTreeElementForElement(subtreeDirectory, name);
        const parentWithoutChilds = Object.assign({}, subtreeDirectory);
        parentWithoutChilds.children = [];
        element.object = new Element(name, ELEMENT_TYPE.SUBTREE, parentWithoutChilds, name, undefined,undefined);
        return element;
    }

    /**
     * Loading all Elements from Path recrusive
     *
     * @param path: String              Path to Directory/File where Elements need to be loaded
     * @param extractElements: Boolean  true = load Elements from file; false = just load files
     * @returns TreeElement[]
     */
    loadAllElements(path, extractElements){
        const elements= [];
        const directory = FileController.loadDirectory(path);
        directory.forEach(file => {
            const element = this.loadElement(file, extractElements);
            if(element){
                elements.push(element);
            }
        })
        return elements;
    }

    /**
     * recrusive helpfunction for loadAllElements
     *
     * @param file: File                File
     * @param extractClasses:Boolean    true = load Elements from file; false = just load files
     * @returns TreeElement
     */
    loadElement(file, extractClasses){
        const treeElement = this.createTreeElementByFile(file);
        if(file.isDirectory){
            treeElement.children = this.loadAllElements(treeElement.object.path, extractClasses);
            return treeElement;
        }else if(!IGNORED_FILES.includes(file.name) && extractClasses){
            treeElement.children = this.loadElementInfos(treeElement);
            return treeElement;
        }
        return undefined;
    }

    /**
     * Creating treeElement for extracted Infos from File
     *
     * @param treeElement           ParentElement
     * @returns TreeElement[]
     */
    loadElementInfos(treeElement){
        if(treeElement.type === TREE_TYPE.FILE){
            const fileContent = FileController.loadFile(treeElement.object.path);
            const matches = fileContent.match(CLASS_NAME_REGEX); // find all class names
            if(matches){
                const result = [];
                for(let i = 0; i < matches.length; i++){
                    const match = matches[i];
                    const className = match.substring(CLASS_NAME_REGEX_OFFSET, match.length);
                    let ignore = false;
                    for(let i = 0; i < IGNORED_CLASS_PREFIXES.length; i++){
                        if(className.startsWith(IGNORED_CLASS_PREFIXES[i])){
                            ignore = true;
                            break;
                        }
                    }
                    if(!ignore){
                        const element = this.createTreeElementForElement(treeElement, className);
                        element.object = this.fileParser.parseElement(fileContent, element, treeElement, className);
                        result.push(element);
                    }
                }
                return result;
            }
        }
        return [];
    }
    createTreeElementByFile(file){
        return new TreeElement(file.name, file.isDirectory ? TREE_TYPE.DIRECTORY : TREE_TYPE.FILE, file.path, file);
    }
    createTreeElementForElement(parent, name){
        return new TreeElement(name, TREE_TYPE.ELEMENT, parent.object.path + '$' + name, undefined);
    }

    /**
     * Searching for Child which contains the element
     *
     * @param element           element that need to be found
     * @param treeElement       Parentelement in which to be searched
     * @returns TreeElement
     */
    static findTreeElementFromElement(element, treeElement){
        let result;
        if(treeElement.object.uuid && treeElement.object.uuid === element.uuid){
            return treeElement;
        }
        for(let i = 0; result === undefined && treeElement.children && i < treeElement.children.length; i++){
            result = ProjectTreeHandler.findTreeElementFromElement(element, treeElement.children[i]);
        }
        return result;
    }

    /**
     * Searching for Child by Id
     *
     * @param id                id that need to be found
     * @param treeElement      Parentelement in which to be searched
     * @returns TreeElement
     */
    static findTreeElementById(id, treeElement){
        let result;
        if(treeElement.id === id){
            return treeElement;
        }
        for(let i = 0; result === undefined && treeElement.children && i < treeElement.children.length; i++){
            result = ProjectTreeHandler.findTreeElementById(id, treeElement.children[i]);
        }
        return result;
    }

    /**
     *
     * @param name              name that need to be found
     * @param treeElement       Parentelement in which to be searched
     * @returns TreeElement
     */
    static findTreeElementByName(name, treeElement){
        let result;
        if(treeElement.object.name && treeElement.object.name === name){
            return treeElement;
        }
        for(let i = 0; result === undefined && treeElement.children && i < treeElement.children.length; i++){
            result = ProjectTreeHandler.findTreeElementByName(name, treeElement.children[i]);
        }
        return result;
    }
}