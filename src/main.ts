/* eslint-disable */
import Vue from "vue";
import DsdGui from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import VueKonva from "vue-konva";
// @ts-ignore
import VueTabsChrome from "vue-tabs-chrome";

Vue.use(VueTabsChrome);
Vue.use(VueKonva);
export const eventHub = new Vue();
Vue.prototype.$eventHub = eventHub; //Global event bus
Vue.config.productionTip = false;
Vue.prototype.$pathConnector = "\\";

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(DsdGui),
}).$mount("#app");
