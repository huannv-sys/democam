<template>
    <v-card>
        <v-layout>
            <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false" color="indigo-darken-1"
                class="border-2 border-sky-500">
                <div class="p-2 py-8 flex items-center justify-center">
                    <img :src="selectedLogo" class="w-[6rem] bg-white p-2 rounded-md" />
                </div>
                <SidebarLayout :itemsNavegation="filteredItems" :rail="rail" />
            </v-navigation-drawer>
            <v-main class="h-screen bg-slate-100 block">
                <HeaderLayout :avatarPath="avatarPath" @action-rail="rail = !rail" />
                <section class="overflow-y-auto section_main p-8">
                    <router-view />
                </section>
            </v-main>
        </v-layout>
    </v-card>
    <div class="fixed bottom-2 right-3" v-if="codcliente === 'All'">
        <v-btn icon @click="showContainerLogs = !showContainerLogs" color="blue">
            <v-icon>mdi-code-greater-than-or-equal</v-icon>
        </v-btn>
    </div>
    <transition name="slide-fade">
        <div v-if="showContainerLogs"
            class="fixed bottom-3 right-3 max-w-[25rem] min-w-[23rem] bg-white text-xs rounded-md overflow-hidden shadow-lg">
            <div class="flex justify-center bg-blue-500 text-white cursor-pointer"
                @click="showContainerLogs = !showContainerLogs">
                <v-icon>mdi-chevron-down</v-icon>
            </div>
            <div class="max-h-[15rem] min-h-[13rem] overflow-y-auto container_scroll">
                <div class="item_event border-b border-gray-300" v-for="(item, i) in itemsLogs" :key="i">
                    <div class="w-full text-blue-500 pt-2 flex gap-1 items-center">
                        <div class="flex items-center pl-2">
                            <div class="rounded-full w-2 h-2 bg-blue-500 mr-2"></div>
                        </div>
                        <div>
                            {{ item.Fecha }} {{ item.Hora }}
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="flex-1 pb-2 px-3 pl-1">{{ item }}</div>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>
<script>
/* eslint-disable */
import { notificationsLogsApi } from '@/api/NotificationsService';
import avatarImage from "@/assets/iconuser_hombre.png";
import logoBusinessDuragas from "@/assets/duragas_logo.png";
import logoBusinessSignia from "@/assets/signia_logo.png";
import logoBusinessSysnet from "@/assets/login/logo_sysnet.png";
import HeaderLayout from "./HeaderLayout.vue";
import SidebarLayout from './SidebarLayout.vue';
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue';
import store from "@/store";

export default {
    components: {
        HeaderLayout,
        SidebarLayout
    },
    data() {
        return {
            avatarPath: avatarImage,
            logoBusinessDuragas: logoBusinessDuragas,
            logoBusinessSignia: logoBusinessSignia,
            logoBusinessSysnet: logoBusinessSysnet
        }
    },
    computed: {
        selectedLogo() {
            if (this.role === 'Administrador') {
                if (this.codcliente === 'All') {
                    return this.logoBusinessSysnet;
                } else if (this.codcliente === 'SI001') {
                    return this.logoBusinessSignia;
                } else if (this.codcliente === 'DU001') {
                    return this.logoBusinessDuragas;
                } else {
                    return this.logoBusinessSysnet;
                }
            } else {
                if (this.codcliente === 'SI001') {
                    return this.logoBusinessSignia;
                } else if (this.codcliente === 'DU001') {
                    return this.logoBusinessDuragas;
                } else {
                    return this.logoBusinessSysnet;
                }
            }
        }
    },
    setup() {
        const drawer = ref(true);
        const rail = ref(true);
        const ItemsNavegation = ref([
            {
                icon: "mdi-home",
                title: "Dashboard",
                value: "Dashboard",
                to: "home",
                children: []
            },
            {
                icon: "mdi-bell",
                title: "Eventos",
                value: "Eventos",
                to: "",
                children: [
                    {
                        icon: "mdi-format-list-bulleted",
                        title: "Pendientes listados",
                        value: "Pendientes listados",
                        to: "pendienteslistados",
                        children: []
                    },
                    {
                        icon: "mdi-image",
                        title: "Pendientes iconos",
                        value: "Pendientes iconos",
                        to: "pendientesiconos",
                        children: []
                    },
                    {
                        icon: "mdi-bell-check",
                        title: "Confirmados",
                        value: "Confirmados",
                        to: "confirmados",
                        children: []
                    },
                    {
                        icon: "mdi-bell-remove",
                        title: "Descartados",
                        value: "Descartados",
                        to: "descartados",
                        children: []
                    }
                ]
            },
            {
                icon: "mdi-file-table",
                title: "Reportes",
                value: "Reportes",
                to: "reportes",
                children: []
            },
            {
                icon: "mdi-cog",
                title: "Mantenimientos",
                value: "Mantenimientos",
                to: "",
                children: [
                    {
                        icon: "mdi-account",
                        title: "Usuarios",
                        value: "Usuarios",
                        to: "usuarios",
                        children: []
                    },
                    {
                        icon: "mdi-bell-plus-outline",
                        title: "Tipo eventos",
                        value: "Tipo eventos",
                        to: "tipoeventos",
                        children: []
                    },
                    {
                        icon: "mdi-forum",
                        title: "Respuestas predefinidas",
                        value: "Respuestas predefinidas",
                        to: "respuestaspredefinidas",
                        children: []
                    },
                    {
                        icon: "mdi-account-clock",
                        title: "Turnos",
                        value: "Turnos",
                        to: "turnos",
                        children: []
                    },
                    {
                        icon: "mdi-form-select",
                        title: "Procedimientos",
                        value: "Procedimientos",
                        to: "procedimientos",
                        children: []
                    },
                    {
                        icon: "mdi-truck",
                        title: "Vehiculos",
                        value: "Vehiculos",
                        to: "vehiculos",
                        children: []
                    }
                ]
            },
            {
                icon: "mdi-cog",
                title: "Mantenimientos",
                value: "MantenimientosCuentas",
                to: "",
                children: [
                    {
                        icon: "mdi-account",
                        title: "Clientes",
                        value: "Clientes",
                        to: "clientes",
                        children: []
                    },
                    {
                        icon: "mdi-bell-plus-outline",
                        title: "Tipo eventos",
                        value: "Tipo eventos",
                        to: "tiposeventos_cuentas",
                        children: []
                    },
                    {
                        icon: "mdi-truck",
                        title: "Vehiculos",
                        value: "Vehiculos",
                        to: "vehiculos_cuentas",
                        children: []
                    }
                ]
            },
            {
                icon: "mdi-cog",
                title: "Mantenimientos",
                value: "MantenimientosRoot",
                to: "",
                children: [
                    {
                        icon: "mdi-account",
                        title: "Cuentas",
                        value: "Cuentas",
                        to: "cuentas",
                        children: []
                    }
                ]
            },
            {
                icon: "mdi-group",
                title: "Grupos",
                value: "Grupos",
                to: "",
                children: [
                    {
                        icon: "mdi-account-multiple",
                        title: "Usuarios",
                        value: "GUsuarios",
                        to: "grupousuarios",
                        children: []
                    },
                    {
                        icon: "mdi-truck",
                        title: "Unidades",
                        value: "GUnidades",
                        to: "grupounidades",
                        children: []
                    },
                    {
                        icon: "mdi-bell-alert",
                        title: "Eventos",
                        value: "GEventos",
                        to: "grupoeventos",
                        children: []
                    }
                ]
            },
            {
                icon: "mdi-account-lock",
                title: "Reglas",
                value: "Reglas",
                to: "reglas",
                children: []
            }
        ]);

        const role = ref('');
        const codcliente = ref('');
        const itemsLogs = ref([]);
        const showContainerLogs = ref(false)

        watch(showContainerLogs, (newVal) => {
            if (newVal) {
                const interval = setInterval(loadLogs, 10000); // Llama a loadLogs cada 10 segundos
                loadLogs(); // También carga los logs inmediatamente al cambiar a true
                onBeforeUnmount(() => {
                    clearInterval(interval);
                });
            }
        });

        const loadLogs = async () => {
            const data = {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codclienteAdmin,
                rows: 10
            }
            notificationsLogsApi(data)
                .then(response => {
                    const dataLogs = response.data.data
                    itemsLogs.value = dataLogs.map(item => {
                        // Copiar el objeto actual omitiendo los campos 'link_imagen' y 'link_video'
                        const { ID, Cod_Cliente, Cod_Cuenta, Geocerca, Grupo, Fecha_Ultima_Accion, Link_Imagen, List_Comentarios, Link_Video, ...rest } = item;
                        return rest; // Devolver un nuevo objeto sin los campos especificados
                    });
                })
        }

        const filteredItems = computed(() => {
            // Lógica para filtrar los ítems según el rol
            if (store.state.rol === 'Administrador') {
                if (store.state.codclienteAdmin == "All") {
                    if (store.state.codcuenta === '0000') {
                        return ItemsNavegation.value.filter(item => item.value === 'Dashboard' || item.value === 'Eventos' || item.value === 'MantenimientosRoot');
                    } else {
                        return ItemsNavegation.value.filter(item => item.value === 'Dashboard' || item.value === 'Eventos' || item.value === 'MantenimientosCuentas');
                    }
                } else {
                    return ItemsNavegation.value.filter(item => item.value != 'MantenimientosCuentas' && item.value != 'MantenimientosRoot');// Muestra todos los ítems para el rol de administrador
                }
            } else if (store.state.rol === 'Operador') {
                // Filtra la lista para mostrar solo ciertos ítems para el rol de usuario
                return ItemsNavegation.value.filter(item => item.value === 'Eventos' || item.value === 'Reportes');
            } else if (store.state.rol === 'Supervisor') {
                // Filtra la lista para mostrar solo ciertos ítems para el rol de usuario
                return ItemsNavegation.value.filter(item => item.value === 'Dashboard' || item.value === 'Eventos' || item.value === 'Reportes');
            } else {
                return []; // Si el rol no coincide con ninguna condición, muestra una lista vacía
            }
        });

        const handleResize = () => {
            rail.value = window.innerWidth <= 1000; // Define aquí el ancho máximo para considerar como pantalla pequeña
        };

        onMounted(async () => {
            role.value = store.state.rol
            codcliente.value = store.state.codclienteAdmin
            if (codcliente.value == "All" && store.state.codcuenta != "0000") {
                await loadLogs()
            }
            // Llama a la función handleResize al cargar la página y en cada cambio de tamaño de la ventana
            handleResize();
            window.addEventListener("resize", handleResize);
        })

        return {
            showContainerLogs,
            filteredItems,
            ItemsNavegation,
            codcliente,
            itemsLogs,
            drawer,
            rail,
            role
        }
    }
}
</script>
<style>
.v-list-item-title {
    font-size: 14px !important;
}

.v-list-item-subtitle {
    font-size: 13px !important;
}

.section_main {
    overflow-y: auto !important;
    height: 100%;
    padding-bottom: 5rem !important;
}

.slide-fade-enter-active {
    transition: all 0.3s ease;
}

.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.item_event {
    border-bottom: 1px gray;
}
</style>