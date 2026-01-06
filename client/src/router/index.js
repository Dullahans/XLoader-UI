import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/params',
    name: 'ParamEditor',
    component: () => import('@/views/ParamEditor.vue'),
    meta: { title: '参数编辑' }
  },
  {
    path: '/files',
    name: 'FileManager',
    component: () => import('@/views/FileManager.vue'),
    meta: { title: '文件管理' }
  },
  {
    path: '/device',
    name: 'DeviceConnect',
    component: () => import('@/views/DeviceConnect.vue'),
    meta: { title: '设备连接' }
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 路由守卫 - 更新页面标题
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title || '电子负载'} - 参数管理系统`
  next()
})

export default router




