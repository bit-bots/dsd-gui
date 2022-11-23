import Vue from "vue";
import Vuex from "vuex";
import CacheController from "@/controller/CacheController";
import ProjectController from "@/controller/ProjectController";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    projectConfigurationLocal: undefined,
    projectConfiguration: undefined,
    theme: {
      darkMode: false,
    },
  },
  mutations: {
    resetGraphConfig(state) {
      // @ts-ignore
      state.projectConfiguration.graphConfig = {};
    },
    resetSingleGraphConfig(state, payload) {
      // @ts-ignore
      state.projectConfiguration.graphConfig[payload] = undefined;
    },
    updateSingleGraphConfig(state, payload) {
      // @ts-ignore
      state.projectConfiguration.graphConfig[payload.instance] = payload.graphConfig;
    },
    loadProject(state, payload) {
      CacheController.loadProject(payload.projectConfigurationLocal.id);
      // @ts-ignore
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
        // @ts-ignore
        state.projectConfiguration.graphConfig[instance] = newGraphConfigs[instance];
      }
    },
    closeProject(state) {
      CacheController.closeProject();
      state.projectConfigurationLocal = undefined;
    },
    setTheme(state, payload) {
      state.theme = payload;
    },
  },
  actions: {},
  modules: {},
});
