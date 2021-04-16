const Store = require('electron-store');
const RECENT_PROJECT_LENGTH = 3;
const store = new Store();

/**
 * CacheController
 * Store and restore JSONs from the persistent local storage
 *
 */

export default class CacheController{

    // Functions to handle the theme

    static getTheme(){
        return store.get('theme');
    }
    static setTheme(theme){
        store.set('theme', theme);
    }

    // actual opend File

    static closeProject(){
        this.addToRecentProjectIds(this.getActualProjectId());
        store.delete('actualProjectId');
    }
    static loadProject(projectId){
        const beforeProjectId = this.getActualProjectId();
        store.set('actualProjectId', projectId);
        this.addToRecentProjectIds(beforeProjectId);
    }
    static getActualProjectId(){
        return store.get('actualProjectId');
    }

    // local Project Configurations

    static getLocalProjectConfiguration(id){
        const localConfigurations = store.get('localConfigurations')
        if(localConfigurations){
            return localConfigurations[id];
        }
        return undefined;
    }
    static addLocalProjectConfiguration(project){
        let localConfigurations = store.get('localConfigurations')
        if(!localConfigurations){
            localConfigurations = {};
        }
        localConfigurations[project.id] = project
        store.set('localConfigurations', localConfigurations);
    }


    // recent Project

    static getRecentProjectIds(){
        const response = store.get('recentProjectIds');
        if(!Array.isArray(response)){
            return [];
        }
        return response;
    }
    static removeFromRecentProjects(id){
        if(id){
            let tempRecentProjectIds = this.getRecentProjectIds();
            tempRecentProjectIds = tempRecentProjectIds.filter(o => o.id !== id);
            if(tempRecentProjectIds){
                store.set('recentProjectIds', tempRecentProjectIds);
            }else{
                store.delete('recentProjectIds');
            }
        }
    }
    static addToRecentProjectIds(projectId){
        if(projectId){
            let tempRecentProjectIds = this.getRecentProjectIds();
            tempRecentProjectIds = tempRecentProjectIds.filter(o => o !== projectId);
            tempRecentProjectIds.unshift(projectId);
            tempRecentProjectIds = tempRecentProjectIds.slice(0,RECENT_PROJECT_LENGTH);
            store.set('recentProjectIds', tempRecentProjectIds);
        }
    }

    // reset the local storage (without theme)
    static removeAllLocalConfigurations(){
        store.delete('localConfigurations');
        store.delete('recentProjectIds');
    }
}