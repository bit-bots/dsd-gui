import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        text: "#000000",
        primary: "#fafafa",
        darkPrimary: "#c7c7c7",
        primaryLighten1: "#ffffff",
        primaryText: "#474747",
        elementStroke: "#bfc6c2",
        elementDarkBackground: "#929292",
        elementLightBackground: "#bfc6c2",
        secondary: "#73e7fd",
        accent: "#82B1FF",
        error: "#FF5252",
        info: "#2196F3",
        success: "#4CAF50",
        warning: "#FFC107",
        grey: "#666666",
      },
      dark: {
        text: "#ffffff",
        primary: "#3c3f41",
        primaryLighten1: "#535658",
        darkPrimary: "#2b2b2b",
        primaryText: "#e0e7e3",
        elementStroke: "#bfc6c2",
        elementDarkBackground: "#3c3f41",
        elementLightBackground: "#bfc6c2",
        secondary: "#73e7fd",
        accent: "#82B1FF",
        error: "#FF5252",
        info: "#2196F3",
        success: "#4CAF50",
        warning: "#FFC107",
        grey: "#666666",
      },
    },
  },
  icons: {
    iconfont: "mdi",
    values: {},
  },
});
