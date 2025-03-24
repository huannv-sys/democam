import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            meta: {
                title: "Home",
                requiresAuth: true
            },
            path: "/",
            component: () => import("@/layouts/MasterLayout.vue"),
            children: [
                {
                    name: "home",
                    path: "home",
                    component: () => import("@/views/HomeView.vue"),
                },
                {
                    name: "pendienteslistados",
                    path: "pendienteslistados",
                    component: () => import("@/views/notifications/ListedEarringsView.vue"),
                },
                {
                    name: "atenderevento",
                    path: "atenderevento",
                    component: () => import("@/views/notifications/AttendView.vue"),
                },
                {
                    name: "pendientesiconos",
                    path: "pendientesiconos",
                    component: () => import("@/views/notifications/IconsEarringsView.vue"),
                },
                {
                    name: "confirmados",
                    path: "confirmados",
                    component: () => import("@/views/notifications/ConfirmedView.vue"),
                },
                {
                    name: "descartados",
                    path: "descartados",
                    component: () => import("@/views/notifications/DiscardedView.vue"),
                },
                {
                    name: "reportes",
                    path: "reportes",
                    component: () => import("@/views/ReportView.vue"),
                },
                {
                    name: "usuarios",
                    path: "usuarios",
                    component: () => import("@/views/maintenance/UsersView.vue"),
                },
                {
                    name: "tipoeventos",
                    path: "tipoeventos",
                    component: () => import("@/views/maintenance/EventsView.vue"),
                },
                {
                    name: "respuestaspredefinidas",
                    path: "respuestaspredefinidas",
                    component: () => import("@/views/maintenance/AnswersView.vue"),
                },
                {
                    name: "turnos",
                    path: "turnos",
                    component: () => import("@/views/maintenance/ShiftsView.vue"),
                },
                {
                    name: "procedimientos",
                    path: "procedimientos",
                    component: () => import("@/views/maintenance/ProceduresView.vue"),
                },
                {
                    name: "vehiculos",
                    path: "vehiculos",
                    component: () => import("@/views/maintenance/VehiclesView.vue"),
                },
                {
                    name: "grupousuarios",
                    path: "grupousuarios",
                    component: () => import("@/views/groups/GroupsUsersView.vue"),
                },
                {
                    name: "grupounidades",
                    path: "grupounidades",
                    component: () => import("@/views/groups/GroupsVehicleView.vue"),
                },
                {
                    name: "grupoeventos",
                    path: "grupoeventos",
                    component: () => import("@/views/groups/GroupsEventsView.vue"),
                },
                {
                    name: "reglas",
                    path: "reglas",
                    component: () => import("@/views/RulesView.vue"),
                },
                {
                    name: "clientes",
                    path: "clientes",
                    component: () => import("@/views/accounts/ClientsView.vue"),
                },
                {
                    name: "cuentas",
                    path: "cuentas",
                    component: () => import("@/views/AccountsView.vue"),
                },
                {
                    name: "tiposeventos_cuentas",
                    path: "tiposeventos_cuentas",
                    component: () => import("@/views/accounts/EventsView.vue"),
                },
                {
                    name: "vehiculos_cuentas",
                    path: "vehiculos_cuentas",
                    component: () => import("@/views/accounts/VehiclesView.vue"),
                }
            ]
        },
        {
            meta: {
                title: "Login"
            },
            path: "/login",
            name: "login",
            component: () => import("@/views/LoginView.vue")
        }
    ]
})
// Navigation Guard
router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    if (requiresAuth && !store.state.isAuthenticated) {
        // Si la ruta requiere autenticación y el usuario no está autenticado, redirigir a la página de inicio de sesión
        next({ name: 'login' });
    } else if (to.name === 'login' && store.state.isAuthenticated) {
        if (store.state.rol == "Administrador" || store.state.rol == "Supervisor") {
            next({ name: 'home' });
        } else if (store.state.rol == "Operador") {
            next({ name: 'pendienteslistados' });
        }else {
            next();
        }
    } else if (to.path === '/' && store.state.isAuthenticated) {
        if (store.state.rol == "Administrador" || store.state.rol == "Supervisor") {
            next({ name: 'home' });
        } else if (store.state.rol == "Operador") {
            next({ name: 'pendienteslistados' });
        }
    } else {
        next();
    }

});
export default router;


