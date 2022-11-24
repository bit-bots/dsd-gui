module.exports = {
  pluginOptions: {
    electronBuilder: {
      preload: "src/preload.js",
      builderOptions: {
        productName: "DSDUI",
      },
      nodeIntegration: true,
    },
  },
  transpileDependencies: ["vuetify"],
};
