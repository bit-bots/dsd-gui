module.exports = {
    pluginOptions: {
        electronBuilder: {
            builderOptions: {
                productName: 'DSDUI',
            },
            nodeIntegration: true
        }
    },
  transpileDependencies: [
    'vuetify'
  ]
}
