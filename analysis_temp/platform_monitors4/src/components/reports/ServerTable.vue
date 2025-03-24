<template>
    <v-data-table-server v-model:items-per-page="itemsPerPageInitials" :headers="headers" :items-length="totalItems"
        :items="serverItems" :loading="loading" item-value="name" @update:options="loadItems"
        class="table_server_events custom-scrollbar">
        <template v-slot:[`item.fecha_ultima_accion`]="{ item }">
            {{ item.fecha_ultima_accion.split(' ')[0] }}
        </template>
        <template v-slot:[`item.hora_ultima_accion`]="{ item }">
            {{ item.fecha_ultima_accion.split(' ')[1] }}
        </template>
        <template v-slot:[`item.list_comentario`]="{ item }">
            {{
        item.list_comentarios && item.list_comentarios.length > 0
            ? truncateText(item.list_comentarios[item.list_comentarios.length - 1].comentario)
            : ''
    }}
        </template>
        <template v-slot:[`item.geocerca`]="{ item }">
            {{
        truncateText(item.geocerca)
    }}
        </template>
        <!-- <template v-slot:[`item.usuari`]="{ item }">
            {{
        item.list_comentarios && item.list_comentarios.length > 0
            ? item.list_comentarios[item.list_comentarios.length - 1].usuari
            : ''
    }}
        </template> -->
        <template v-slot:[`item.nombre`]="{ item }">
            {{
        item.list_comentarios && item.list_comentarios.length > 0
            ? truncateText(item.list_comentarios[item.list_comentarios.length - 1].nombre_completo)
            : ''
    }}
        </template>
        <template v-slot:[`item.segundos`]="{ item }">
            {{ Math.abs(item.segundos) >= 60 ? Math.floor(Math.abs(item.segundos) / 60) + ' min ' + (Math.abs(item.segundos) % 60) + ' s' : Math.abs(item.segundos) + ' s' }} 
        </template>
        <template v-slot:[`item.fecha_actual`]="{ item }">
            {{ item.fecha_actual.split(' ')[0] }}
        </template>
        <template v-slot:[`item.hora_evento`]="{ item }">
            {{ item.fecha_actual.split(' ')[1] }}
        </template>


    </v-data-table-server>
    <SelectColumnVue :dataColumn="dataColumn" :openModal="openSelectColumn" @generate-column="initialsDataReport"
        @cancel-item="openSelectColumn = false" />
</template>
<script>
import { reportEventsApi } from '@/api/ReportEventsService';
import { VDataTableServer } from 'vuetify/labs/VDataTable';
import SelectColumnVue from './SelectColumn.vue';
import store from '@/store';
import { ref, watch } from 'vue';

export default {

    props: {
        dataFilter: Object,
        searchstate: Boolean,
       

    },
    components: {
        VDataTableServer,
        SelectColumnVue
    },
    emits: ['update-keyscolumn'],
    setup(props, { emit }) {
        const itemsPerPageInitials = ref(10);
        const dataColumn = ref([
            { title: 'Codigo evento', align: 'start', sortable: false, key: 'cod_evento', status: true },
            { title: 'Placa', key: 'placa', sortable: false, align: 'start', status: true },
            { title: 'Empresa', key: 'empresa', sortable: false, align: 'start', status: true },
            { title: 'Conductor', key: 'conductor', sortable: false, align: 'start', status: true },
            { title: 'Flota', key: 'fleet_name', sortable: false, align: 'start', status: true },
            { title: 'Prioridad', key: 'prioridad', sortable: false, align: 'start', status: true },

            { title: 'Fecha evento', key: 'fecha_actual', sortable: false, align: 'start', status: true },
            { title: 'Hora evento', key: 'hora_evento', sortable: false, align: 'start', status: true },

            { title: 'Latitud', key: 'latitud', sortable: false, align: 'end', status: true },
            { title: 'Longitud', key: 'longitud', sortable: false, align: 'end', status: true },
            { title: 'Velocidad', key: 'velocidad', sortable: false, align: 'end', status: true },
            { title: 'Geocerca', key: 'geocerca', sortable: false, align: 'start', status: true },
            { title: 'Dirección', key: 'direccion', sortable: false, align: 'start', status: true },

            { title: 'Fecha ult. acción', key: 'fecha_ultima_accion', sortable: false, align: 'start', status: true },
            { title: 'Hora ult. acción', key: 'hora_ultima_accion', sortable: false, align: 'start', status: true },

            { title: 'Estado', key: 'descripcion_estado', sortable: false, align: 'start', status: true },
            { title: 'Usuario', key: 'usuario', sortable: false, align: 'end', status: true },
            { title: 'Nombre usuario', key: 'nombre', sortable: false, align: 'end', status: true },
            { title: 'Tiempo atención', key: 'segundos', sortable: false, align: 'start', status: true },
            { title: 'Comentario', key: 'list_comentario', sortable: false, align: 'start', status: true },


        ])
        const headers = ref([])
        const serverItems = ref([]);
        const openSelectColumn = ref(false);
        const loading = ref(true); 
        const totalItems = ref(0);
        const userFilter = ref('');
        const plate = ref('');
        const cod_evento = ref('');
        const description_state = ref('');
        const dateFrom = ref('');
        const dateTo = ref('');
        const stateFilter = ref(false);

        watch(() => props.dataFilter, (newVal) => {
            if (props.searchstate) {
                stateFilter.value = newVal
                plate.value = newVal.plate
                userFilter.value = newVal.userFilter
                cod_evento.value = newVal.type_event
                description_state.value = newVal.state
                dateFrom.value = newVal.dateFrom
                dateTo.value = newVal.dateTo
                openSelectColumn.value = true
            }
        })

        const truncateText = (text) => {
            if (text && text.length > 20) {
                return text.slice(0, 20) + '...';
            }
            return text;
        };



        const initialsDataReport = async (data) => {
            emit('update-keyscolumn', { keyscolumn: data.selectedColumn })
            headers.value = dataColumn.value.filter(item => data.selectedColumn.includes(item.key));
            loading.value = true;
            await reportEventsApi(
                store.state.codcuenta,
                store.state.codcliente,
                plate.value,
                cod_evento.value,
                description_state.value,
                dateFrom.value,
                dateTo.value,
                itemsPerPageInitials.value,
                1,
                userFilter.value
            ).then((response) => {
                serverItems.value = response.data.data ? response.data.data.map(item => {
                    const empresa = item.placa.split(' - ')[1] || ''; // Obtener la parte después del "-" de la placa
                    // item.hora_evento = item.fecha_actual.split(' ')[1];
                    // item.segundos = Math.abs(item.segundos);
                       
                    return {
                        ...item,
                        empresa: empresa,
                        placa: item.placa.replace(` - ${empresa}`, ''), // Eliminar la parte después del "-" de la placa
                        // segundos : Math.abs(item.segundos);
                       


                    };
                }) : [];
                totalItems.value = response.data.totalEventos;
                loading.value = false;
            });
        }

        const loadItems = ({ page, itemsPerPage }) => {
            if (stateFilter.value) {
                loading.value = true;
                reportEventsApi(
                    store.state.codcuenta,
                    store.state.codcliente,
                    plate.value,
                    cod_evento.value,
                    description_state.value,
                    dateFrom.value,
                    dateTo.value,
                    itemsPerPage,
                    page,
                    
                    userFilter.value
                ).then(response => {

                    serverItems.value = response.data.data ? response.data.data.map(item => {
                        const empresa = item.placa.split(' - ')[1] || ''; // Obtener la parte después del "-" de la placa
                        // item.hora_evento = item.fecha_actual.split(' ')[1];  
                        // item.segundos = Math.abs(item.segundos);

                        return {
                            ...item,
                            empresa: empresa,
                            placa: item.placa.replace(` - ${empresa}`, '') // Eliminar la parte después del "-" de la placa
                        };
                    }) : [];
                    totalItems.value = response.data.totalEventos;
                    loading.value = false;
                })
                    .catch(error => {
                        console.log(error)
                    })
            } else {
                loading.value = false;
            }
        };

        return {
            openSelectColumn,
            itemsPerPageInitials,
            headers,
            serverItems,
            loading,
            totalItems,
            plate,
            cod_evento,
            description_state,
            dateFrom,
            dateTo,
            dataColumn,
            initialsDataReport,
            truncateText,
            loadItems,

        };
    }
}
</script>
<style>
.table_server_events {
    color: #797979 !important;
    font-size: 0.8rem;
}

.table_server_events table thead {
    background: #60a5fa;
}

.table_server_events table thead th {
    font-weight: bolder;
    color: #ffffff !important
}
</style>