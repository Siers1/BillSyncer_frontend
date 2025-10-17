import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'Menu',
            component: () => import('../pages/Menu.vue'),
            redirect: '/home',
            children: [
                {
                    path: '/home',
                    name: 'Home',
                    component: () => import('../pages/HomePage.vue'),
                    meta: { title: '首页' },
                },
                {
                    path: '/info',
                    name: 'Info',
                    component: () => import('../pages/InfoPage.vue'),
                    meta: { title: '个人信息' },
                },
                {
                    path: '/bill',
                    name: 'Bill',
                    redirect: '/bill/list',
                    meta: { title: '账本管理' },
                    children: [
                        {
                            path: 'list',
                            name: 'BillList',
                            component: () => import('../pages/BillListPage.vue'),
                            meta: { title: '账本列表' },
                        },
                        {
                            path: 'record',
                            name: 'BillRecord',
                            component: () => import('../pages/RecordsPage.vue'),
                            meta: { title: '消费记录' },
                        },
                    ],
                },
            ],
        },
        {
            path: '/login',
            name: 'Login',
            component: () => import('../pages/LoginPage.vue'),
        },
        {
            path: '/register',
            name: 'Register',
            component: () => import('../pages/RegisterPage.vue'),
        },
    ],
});

// 路由守卫
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();

    // 如果路由需要认证但用户未登录
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        if (!authStore.isLoggedIn) {
            next({ name: 'Login' });
            return;
        }
    }

    // 如果已登录用户访问登录/注册页面，重定向到主页
    if ((to.name === 'Login' || to.name === 'Register') && authStore.isLoggedIn) {
        next({ path: '/home' });
        return;
    }

    next();
});

export default router;
