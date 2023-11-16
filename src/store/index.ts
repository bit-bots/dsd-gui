import Vue from "vue";
import Vuex from "vuex";
import CacheController from "@/controller/CacheController";
import ProjectController from "@/controller/ProjectController";

Vue.use(Vuex);

interface ProjectConfiguration {
  graphConfig: Record<string, unknown>;
}

export default new Vuex.Store({
  state: {
    projectConfiguration: {
      graphConfig: {},
    } as ProjectConfiguration,
    projectConfigurationLocal: {},
    theme: {
      darkMode: false,
    },
  },
  mutations: {
    resetGraphConfig(state) {
      state.projectConfiguration.graphConfig = {};
    },
    resetSingleGraphConfig(state, payload: string) {
      state.projectConfiguration.graphConfig[payload] = undefined;
    },
    updateSingleGraphConfig(state, payload) {
      state.projectConfiguration.graphConfig[payload.instance] = payload.graphConfig;
    },
    loadProject(state, payload) {
      CacheController.loadProject(payload.projectConfigurationLocal.id);
      state.projectConfiguration = ProjectController.getConfig(
        payload.projectConfigurationLocal.path
      );
      state.projectConfigurationLocal = payload.projectConfigurationLocal;
    },
    updateProjectConfig(state, payload) {
      state.projectConfiguration = payload.projectConfiguration;
      state.projectConfigurationLocal = payload.projectConfigurationLocal;
    },
    updateGraphConfig(state, payload) {
      const newGraphConfigs = payload.graphConfigs;
      for (const instance in newGraphConfigs) {
        state.projectConfiguration.graphConfig[instance] = newGraphConfigs[instance];
      }
    },
    closeProject(state) {
      CacheController.closeProject();
      state.projectConfigurationLocal = {};
    },
    setTheme(state, payload) {
      state.theme = payload;
    },
  },
  actions: {},
  modules: {},
});
