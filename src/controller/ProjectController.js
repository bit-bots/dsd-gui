import TreeElement from '../entities/TreeElement';
import { TREE_TYPE } from '@/enumerates/TreeType';
import ProjectConfiguration from '../entities/ProjectConfiguration';
import Tab from '../entities/Tab';
import Utils, { LINE_SPLIT_REGEX } from '../utils/Utils';
import FileController from './FileController';
import ProjectTreeHandler from '@/utils/ProjectTreeHandler';
import store from '@/store';
import { ELEMENT_TYPE } from '@/enumerates/ElementType';
import FileParser from '@/utils/FileParser';

/**
 * Projectcontroller
 */
export default class ProjectController{

    /**
     * Check if path containing an loaded project
     * @param path
     * @returns {boolean}
     */
    static isInitialized(path){
        const directory = FileController.loadDirectory(path);
        const configCount = directory.filter(o => o.type === Utils.getConfigType()).length;
        return configCount === 1;

    }

    /**
     * Returns the Configuration of an Path
     *
     * @param path
     * @returns {ProjectConfiguration}
     */

    static getConfig(path){
        const file = FileController.loadFile(path + Utils.getDir() + 'config.' + Utils.getConfigType());
        const parsedFile = JSON.parse(file);
        return new ProjectConfiguration(parsedFile.id, parsedFile.projectName, parsedFile.behaviorModuleName, parsedFile.dsdFileName, parsedFile.graphConfig, parsedFile.graphAttrs);
    }

    /**
     * Checking if path can be Project
     *
     * @param path
     * @returns {{canProject: boolean, message: string}}
     */
    static canBeProject(path){
        const response = {canProject: true, message: ''}
        const directory = FileController.loadDirectory(path);
        const dsdElementCount = directory.filter(o => o.type === 'dsd').length
        const possibleBehaviorModules = directory.filter(o => o.type === 'py').length
        const actionDirectoryCount = directory.filter(o => o.isDirectory && o.name === 'actions').length;
        const decisionDirectoryCount = directory.filter(o => o.isDirectory && o.name === 'decisions').length;
        const configCount = directory.filter(o => o.type === Utils.getConfigType()).length;
        if(dsdElementCount < 1){
            response.canProject = false;
            response.message += 'No match for DSD found.\n'
        }
        if(possibleBehaviorModules < 1){
            response.canProject = false;
            response.message += 'No match for Behavior module found.\n'
        }
        if(actionDirectoryCount !== 1){
            response.canProject = false;
            response.message += 'ONE directory with the name \'actions\' needed.\n'
        }
        if(decisionDirectoryCount !== 1){
            response.canProject = false;
            response.message += 'ONE directory with the name \'decisions\' needed.\n'
        }
        if(configCount > 0){
            response.canProject = false;
            response.message += 'Projekt already importet.\n'
        }
        return response;
    }

    /**
     * Initialize a project
     * @param path:                 Path from the project
     * @param projectConfiguration  New Projectconfiguration
     */
    static initializeProject(path, projectConfiguration){
        FileController.createFile(path, 'config.'+ Utils.getConfigType(), JSON.stringify(projectConfiguration));
    }

    /**
     * init Projectstate
     */
    constructor() {
        this.projectTreeHandler =  new ProjectTreeHandler();
        this.projectTree = [];
        this.tabs= [];
        this.selectedTab= undefined;
        this.projectTree = this.projectTreeHandler.loadProjectTree();
        const dsdFile = this.projectTree.filter(o => o.name === store.state.projectConfiguration.dsdFileName)[0];
        //this.openTab(dsdFile, true)
    }

    /**
     * Adding new Subtree to the ProjectTree
     * @param subtreeName
     * @returns {TreeElement}:
     */
    createSubtree(subtreeName){
        const treeElement = this.projectTreeHandler.createSubtreeTreeElement(this.getSubtreesFolder(),subtreeName);
        this.getSubtreesFolder().children.push(treeElement);
        return treeElement;
    }

    /**
     * Updating an TreeLement by Element
     * @param element
     */
    updateElement(element){
        if(element.type !== 'ENTRY'){
            const treeElement = this.getTreeElementByElement(element);
            treeElement.object = element;
        }else{
            const dsdFile = this.projectTree.filter(o => o.name === store.state.projectConfiguration.dsdFileName)[0];
        }

    }

    /**
     * Search TreeElement by Element
     * @param element
     * @returns {TreeElement}
     */
    getTreeElementByElement(element){
        switch (element.type){
            case ELEMENT_TYPE.SUBTREE:
                return ProjectTreeHandler.findTreeElementFromElement(element, this.getSubtreesFolder());
            case ELEMENT_TYPE.ACTION:
                return ProjectTreeHandler.findTreeElementFromElement(element, this.getActionFolder());
            default:
                return ProjectTreeHandler.findTreeElementFromElement(element, this.getDecisionFolder());
        }
    }

    /**
     * Search TreeElement by Id
     * @param id
     * @param tree
     * @returns {TreeElement}
     */
    getTreeElementById(id, tree){
        const temporaryTree = new TreeElement('parent', undefined, undefined, undefined);
        temporaryTree.children = tree;
        return ProjectTreeHandler.findTreeElementById(id, temporaryTree);
    }

    /**
     * Seach TreeElement by Name
     * @param name
     * @param type
     * @returns {TreeElement}
     */
    getTreeElementByName(name, type){
        switch (type){
            case '#':
                return ProjectTreeHandler.findTreeElementByName(name, this.getSubtreesFolder());
            case '@':
                return ProjectTreeHandler.findTreeElementByName(name, this.getActionFolder());
            default:
                return ProjectTreeHandler.findTreeElementByName(name, this.getDecisionFolder());
        }
    }

    /**
     * Save config file from the project
     */
    saveConfigFile(){
        const projectConfig = store.state.projectConfiguration;
        const path = store.state.projectConfigurationLocal.path + Utils.getDir() + 'config.dsdui';
        FileController.updateFile(path, JSON.stringify(projectConfig));
    }

    /**
     * persistent all nodes inside the python classcomments
     * @param nodes: Nodes[]
     */
    savePythonFiles(nodes){
        const fileParser = new FileParser();
        for(const node in nodes){
            if(nodes[node].type !== ELEMENT_TYPE.SUBTREE){
                const treeElement = this.getTreeElementByElement(nodes[node]);
                if(treeElement){
                    const path = treeElement.object.containingFile.object.path;
                    const file = FileController.loadFile(path);
                    const updatedFile = fileParser.updateElementComment(file, nodes[node]);
                    FileController.updateFile(path, updatedFile);
                }
            }

        }
    }

    /**
     * Saving all graphs
     * @param savedInstances
     */
    saveDsdFile(savedInstances){
        const path = store.state.projectConfigurationLocal.path + Utils.getDir() + store.state.projectConfiguration.dsdFileName;
        let dsdFile = FileController.loadFile(path)

        //TODO Workaround
        const firstLine= dsdFile.substring(0, dsdFile.indexOf('\n'));
        if(firstLine.length !== 0){
            dsdFile = '\n' + dsdFile;
        }

        for(let i = 0 ; i < savedInstances.length; i++){
            let regex = undefined;
            if(savedInstances[i].isBehaviorTree){
                regex = /\n-->(.*(?:\r?\n(?!\r?\n).*)*)/g;
            }else{
                regex = new RegExp('\\n'+'#' + savedInstances[i].name +'(.*(?:\\r?\\n(?!\\r?\\n).*)*)');
            }
            const match = dsdFile.match(regex);
            if(match){
                dsdFile = dsdFile.replace(regex, '\n' + savedInstances[i].block)
            }else{
                dsdFile += '\n\n\n' + savedInstances[i].block;
            }
        }
        FileController.updateFile(path, dsdFile);
    }
    getSubtreesFolder(){
        return this.projectTree[2];
    }
    getActionFolder(){
        return this.projectTree[0];
    }
    getDecisionFolder(){
        return this.projectTree[1];
    }
    getSubtreeNames(){
        return [...this.getSubtreesFolder().children].map(o => o.name);
    }
    openTab(treeElement, uncloseable){
        let favico;
        if(treeElement.type === TREE_TYPE.FILE){
            switch (treeElement.object.type){
                case 'dsd':
                    if(store.state.theme.darkMode){
                        favico = require('../assets/FlowChartLightFavIcon.png')
                    }else{
                        favico = require('../assets/FlowChartDarkIcon.png')
                    }
                    break;
                case 'py':
                    favico = require('../assets/pythonFavIcon.png')
                    break;
                default:
            }
        }else{
            if(store.state.theme.darkMode){
                favico = require('../assets/FlowChartLightFavIcon.png')
            }else{
                favico = require('../assets/FlowChartDarkIcon.png')
            }
        }
        let tabElement = undefined;
        if(treeElement.type !== TREE_TYPE.FILE && !(treeElement.type === TREE_TYPE.ELEMENT && treeElement.object.type === ELEMENT_TYPE.SUBTREE)){
            return;
        }
        tabElement = new Tab(treeElement, true, treeElement.id, favico, !uncloseable);
        if(this.tabs.filter(o => o.key ===tabElement.key).length <= 0){
            this.tabs.push(tabElement);
        }
        this.selectTab(tabElement.key)
    }
    selectTab(tabKey){
        const indexOfTab = [...this.tabs].map(o => o.key).indexOf(tabKey);
        if(indexOfTab >= 0){
            this.selectedTab = this.tabs[indexOfTab];
        }
    }
    removeTab(tabKey){
        const indexOfTab = [...this.tabs].map(o => o.key).indexOf(tabKey);
        if(indexOfTab >= 0){
            this.tabs.splice(indexOfTab,1);
            if(this.selectedTab.key === tabKey){
                if(indexOfTab >0){
                    this.selectedTab = this.tabs[indexOfTab-1];
                    return;
                }
                this.selectedTab = undefined;
            }

        }
    }
}