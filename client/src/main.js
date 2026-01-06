import Vue from 'vue';
import App from './App.vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import wsClient from './utils/websocket';

Vue.config.productionTip = false;

// 全局引入 ElementUI
Vue.use(ElementUI);

// 将 WebSocket 客户端挂载到 Vue 原型上，方便在组件中使用
Vue.prototype.$socket = wsClient;

new Vue({
  render: h => h(App)
}).$mount('#app');
