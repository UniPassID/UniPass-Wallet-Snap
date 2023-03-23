const plugins = ['@vue/babel-plugin-transform-vue-jsx']

const net = process.env.VUE_APP_Net

// if (net === 'mainnet' || net === 'testnet') {
//   plugins.push('transform-remove-console')
// }

module.exports = {
  plugins: plugins,
  presets: ['@vue/cli-plugin-babel/preset'],
}
