const { defineConfig } = require('@vue/cli-service')
const path = require('path')

module.exports = defineConfig({
  transpileDependencies: true,
  // Node v12.16.3 does not support the ESM requirements of ESLint 8.
  // We disable lintOnSave to allow the development server to start.
  // Strongly recommended: Upgrade Node.js to v16 or v18 for full compatibility.
  lintOnSave: false,
  // 让打包后的静态资源可被任意 Python 服务器用静态目录方式托管（不依赖固定域名/路径）
  publicPath: './',
  devServer: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true
      }
    }
  },
  // 打包输出到项目根目录的 cs/（你要的交付目录）
  outputDir: path.resolve(__dirname, '../cs'),
  // 让资源目录直接是 /js /css /img /fonts（后面把 fonts 改成 font）
  assetsDir: '',
  productionSourceMap: false
  ,
  chainWebpack: (config) => {
    // 把默认的 fonts/ 改成 font/（满足你的目录要求）
    config.module
      .rule('fonts')
      .set('generator', {
        filename: 'font/[name].[hash:8][ext]'
      });
  }
})




