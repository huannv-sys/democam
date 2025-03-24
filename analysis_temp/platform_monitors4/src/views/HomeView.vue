<template>
    <div class="mb-5">
        <h1 class="font-bold text-xl title_poppins">Dashboard</h1>
        <div class="grid grid-cols-4 gap-5 pt-5">
            <CardEventsVue :BgCard="card.bgCard" :Icon="card.icon" :Amount="card.amount" :Title="card.title"
                v-for="(card, index) in listCards" :key="index" />
            <template v-if="codcliente == 'All'">
                <div class="col-span-2 p-4 rounded-lg bg-white shadow-md">
                    <p class="text-center text-gray-500 pb-3">Eventos por clientes</p>
                    <BarChartVue :dataChart="dataBarChart" />
                </div>
            </template>
            <template v-else>
                <div class="col-span-2 max-h-[50rem]">
                    <EventNotificationVue :data="dataEvents" />
                </div>
                <div class="col-span-1 max-h-[50rem]">
                    <VehicleNotificationVue :data="dataVehicles" />
                </div>
                <div class="col-span-1 max-h-[50rem]">
                    <OperatorNotificationVue :data="dataOperators" />
                </div>
            </template>
        </div>
    </div>
    <v-dialog v-model="dialogLoader" :scrim="false" persistent width="auto">
        <v-card color="blue">
            <v-card-text>
                Construyendo
                <v-progress-linear indeterminate color="white" class="mb-0"></v-progress-linear>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script>
import { ref, onMounted, onUnmounted } from 'vue';
import CardEventsVue from '@/components/dashboard/CardEvents.vue';
import EventNotificationVue from '@/components/dashboard/EventNotification.vue';
import VehicleNotificationVue from '@/components/dashboard/VehicleNotification.vue';
import OperatorNotificationVue from '@/components/dashboard/OperatorNotification.vue';
import BarChartVue from '@/components/dashboard/BarChart.vue';
import { notificationsAccountApi } from '@/api/NotificationsService';
import { findAllClientsToAccountApi } from '@/api/UsersService';
import { findAllUnitsApi } from '@/api/VehiclesService';
import { homeClientsApi, homeAccountsApi } from '@/api/DashboardService';
import store from '@/store';

export default ({
    name: "HomeView",
    components: {
        BarChartVue,
        CardEventsVue,
        EventNotificationVue,
        VehicleNotificationVue,
        OperatorNotificationVue
    },
    setup() {
        const listCards = ref([
            {
                bgCard: "bg-yellow-400",
                icon: "mdi-bell",
                amount: 0,
                title: "Eventos sin atender",
                key: "unattended_events"
            },
            {
                bgCard: "bg-sky-400",
                icon: "mdi-account-tie-voice",
                amount: 0,
                title: "Eventos en Gestión",
                key: "events_in_management"
            },
            {
                bgCard: "bg-lime-400",
                icon: "mdi-account-check",
                amount: 0,
                title: "Eventos confirmados",
                key: "confirmed_events"
            },
            {
                bgCard: "bg-red-400",
                icon: "mdi-bell-remove",
                amount: 0,
                title: "Eventos descartados",
                key: "discarded_events"
            }
        ]);
        const dataEvents = ref([])
        const dataVehicles = ref([])
        const dataOperators = ref([])
        const dialogLoader = ref(false);
        const codcliente = ref('');
        const dataBarChart = ref([]);

        const loadData = async () => {
            if (store.state.codclienteAdmin == "All") {
                if (store.state.codcuenta == "0000") {
                    console.log("-ROOT-")
                } else {
                    await dashboardForAccounts()
                }
            } else {
                await dashboardForClients()
            }
        }

        const dashboardForAccounts = async () => {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // Se suma 1 porque los meses van de 0 a 11
            const day = String(today.getDate()).padStart(2, '0');

            const formattedDate = `${year}-${month}-${day}`;
            listCards.value[0].title = "Eventos del día"
            listCards.value[1].title = "Clientes registrados"
            listCards.value[2].title = "Operadores registrados"
            listCards.value[3].title = "Unidades registradas"
            listCards.value[3].icon = "mdi-truck"
            const [responseNotifications, responseClients, responseUnits, responseBarChart] = await Promise.all([
                notificationsAccountApi(store.state.codcuenta, store.state.codclienteAdmin, store.state.username, store.state.codregla),
                findAllClientsToAccountApi(store.state.codcuenta),
                findAllUnitsApi(store.state.codcuenta, store.state.codclienteAdmin),
                homeAccountsApi(store.state.codcuenta, formattedDate, formattedDate)
            ])
            const nofitications = responseNotifications.data.data ? responseNotifications.data.data : []
            const usersClients = responseClients.data.data[0].clientes ? responseClients.data.data[0].clientes : []
            const administrators = usersClients.filter(client => client.rol == "Administrador")
            const operators = usersClients.filter(client => client.rol != "Administrador")
            const dataUnits = responseUnits.data.data ? responseUnits.data.data : []
            const unidadesCodUnidad = dataUnits.flatMap(item => item.unidades.map(unidad => unidad.cod_unidad));
            dataBarChart.value = responseBarChart.data.data.clientes_evento
            listCards.value[0].amount = nofitications.length
            listCards.value[1].amount = administrators.length
            listCards.value[2].amount = operators.length
            listCards.value[3].amount = unidadesCodUnidad.length
        }

        const dashboardForClients = async () => {
            const [responseEvent, tableEvent] = await Promise.all([
                notificationsAccountApi(store.state.codcuenta, store.state.codclienteAdmin, store.state.username, store.state.codregla),
                homeClientsApi(store.state.codcuenta, store.state.codclienteAdmin, store.state.username, store.state.codregla)
            ])
            const eventData = responseEvent.data.data;
            Promise.all([
                tableValuePorcentage(tableEvent.data.data_eventos),
                tableValuePorcentage(tableEvent.data.data_vehiculos),
                tableValuePorcentage(tableEvent.data.data_operadores)
            ])
                .then(([events, vehicles, operators]) => {
                    dataEvents.value = events;
                    dataVehicles.value = vehicles;
                    dataOperators.value = operators;
                })
                .catch(error => {
                    // Manejar cualquier error que pueda ocurrir durante el proceso
                    console.error("Error:", error);
                });
            const filterPromises = [
                filterByStatus(eventData, "Sin Atender"),
                filterByStatus(eventData, "En Gestion"),
                filterByStatus(eventData, "Confirmado"),
                filterByStatus(eventData, "Descartado")
            ];

            const filteredResults = await Promise.all(filterPromises);

            listCards.value[0].amount = filteredResults[0].length;
            listCards.value[1].amount = filteredResults[1].length;
            listCards.value[2].amount = filteredResults[2].length;
            listCards.value[3].amount = filteredResults[3].length;
        }

        onMounted(async () => {
            dialogLoader.value = true
            codcliente.value = store.state.codclienteAdmin
            await loadData()
            dialogLoader.value = false
        });

        const intervalId = setInterval(() => {
            loadData();
        }, 15000);

        onUnmounted(() => {
            clearInterval(intervalId);
        });
        const filterByStatus = async (events, status) => {
            return events ? events.filter(event => event.descripcion_estado === status) : [];
        }

        const tableValuePorcentage = async (tableData) => {
            const total = Object.values(tableData).reduce((acc, curr) => acc + curr, 0);

            const resultados = Object.entries(tableData).map(([clave, valor]) => {
                const porcentaje = ((valor / total) * 100).toFixed(2);
                return { clave, valor, porcentaje: parseFloat(porcentaje) }; // Convertir a número para ordenar
            });

            // Ordenar de mayor a menor según el porcentaje
            resultados.sort((a, b) => b.porcentaje - a.porcentaje);

            return resultados;
        };

        return {
            dataBarChart,
            codcliente,
            listCards,
            dataEvents,
            dialogLoader,
            dataVehicles,
            dataOperators
        }
    }
})
</script>