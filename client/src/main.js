import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import './styles/main.less';
import wsClient from './utils/websocket';

Vue.config.productionTip = false;

// 全局引入 ElementUI
Vue.use(ElementUI);

// 将 WebSocket 客户端挂载到 Vue 原型上，方便在组件中使用
Vue.prototype.$socket = wsClient;

// 全局 WebSocket 管理
const initApp = async () => {
  try {
    // 尝试连接 WebSocket
    await wsClient.connect();
    console.log('[main] WebSocket connected successfully');
  } catch (err) {
    console.error('[main] WebSocket connection failed:', err);
  }

  new Vue({
    router,
    store,
    render: h => h(App)
  }).$mount('#app');
};

initApp();
