<template>
    <div>
        <h1 class="font-bold text-xl title_poppins pb-5">Eventos descartados</h1>
        <div class="w-full rounded-lg bg-white shadow-md p-5">
            <div class="w-full flex justify-between pt-4">
                <div class="lg:w-[30%] pb-4 w-full">
                    <v-text-field clearable color="indigo" v-model="search" prepend-inner-icon="mdi-magnify" label="Buscar"
                        hide-details density="compact" variant="outlined"></v-text-field>
                </div>
            </div>
            <SimpleEventsTableVue :desserts="discardedEvents" :listedHeaders="listedHeaders" :search="search" />
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
import { notificationsAccountApi } from '@/api/NotificationsService';
import SimpleEventsTableVue from '@/components/notifications/SimpleEventsTable.vue';
import { onMounted, ref, onUnmounted } from "vue";
import store from '@/store';

export default ({
    components: {
        SimpleEventsTableVue
    },
    setup() {
        const search = ref('');
        const discardedEvents = ref([]);
        const dialogLoader = ref(false);
        const listedHeaders = ref([
            {
                title: 'Desc. evento',
                align: 'start',
                key: 'descripcion_evento',
                sortable: true,
            },
            {
                title: 'Placa',
                align: 'start',
                key: 'placa',
                sortable: true,
            },
            {
                title: 'Conductor',
                align: 'start',
                key: 'conductor',
                sortable: true,
            },
            {
                title: 'Fecha evento', align: 'start', key: 'fecha', sortable: true,
            },
            {
                title: 'Fecha recepción', align: 'start', key: 'fecha_actual', sortable: true,
            },
            {
                title: 'Velocidad', align: 'start', key: 'velocidad', sortable: true,
            },
            {
                title: 'Dirección', align: 'start', key: 'direccion', sortable: true,
            },
            {
                title: 'Estado', align: 'start', key: 'descripcion_estado', sortable: true,
            },
            {
                title: 'Última acción', align: 'start', key: 'fecha_ultima_accion', sortable: true,
            },
            {
                title: 'Prioridad', align: 'center', key: 'prioridad', sortable: true,
            },
            {
                title: 'Evidencias', align: 'center', key: 'evidence', sortable: true,
            }
        ])

        onMounted(async () => {
            dialogLoader.value = true
            await loadData();
            dialogLoader.value = false
        })

        const loadData = async () => {
            const responseEvent = await notificationsAccountApi(store.state.codcuenta, store.state.codclienteAdmin, store.state.username, store.state.codregla);
            discardedEvents.value = responseEvent.data.data ? responseEvent.data.data.filter(event => {
                return event.descripcion_estado === "Descartado";
            }) : []
        }


        const intervalId = setInterval(() => {
            loadData();
        }, 15000);

        onUnmounted(() => {
            clearInterval(intervalId);
        });

        return {
            dialogLoader,
            listedHeaders,
            discardedEvents,
            search
        }
    }
})
</script>