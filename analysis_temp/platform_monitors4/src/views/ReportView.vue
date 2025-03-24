<template>
    <div>
        <h1 class="font-bold text-xl title_poppins pb-5">Reporte de eventos</h1>
        <div class="w-full rounded-lg bg-white shadow-md p-5">
            <div class="container_filters pt-3 pb-5">
                <v-text-field label="Fecha desde" type="date" hide-details density="compact" v-model="dateFrom"
                    variant="outlined" color="indigo"></v-text-field>

                <v-text-field label="Fecha hasta" type="date" hide-details density="compact" v-model="dateTo"
                    variant="outlined" color="indigo"></v-text-field>

                <v-text-field clearable density="compact" color="indigo" v-model="plate" prepend-inner-icon="mdi-truck"
                    label="Placa" hide-details variant="outlined"></v-text-field>

                <v-select label="Tipo evento" :items="['Todos', ...listEventsData.map(event => event.cod_evento)]"
                    variant="outlined" color="indigo" hide-details density="compact" v-model="type_event"></v-select>

                <v-select label="Estado" :items="['Todos', 'Sin Atender', 'En Gestion', 'Confirmado', 'Descartado']"
                    variant="outlined" color="indigo" hide-details density="compact" v-model="state"></v-select>

                 <v-select label="Usuario" :items="['Todos', ...listClientsData.map(client => client.usuario)]"
                    variant="outlined" color="indigo" hide-details density="compact" v-model="userFilter"></v-select> 

                <v-btn color="blue" class="mt-1 custom-btn" @click="searchEventsReport">Buscar</v-btn>
            </div>
            <div class="pb-3">
                <v-btn color="green" size="small" @click="exportReports"> <v-icon>mdi-microsoft-excel</v-icon> Exportar
                    excel</v-btn>
            </div>
            <div class="w-full border">
                <ServerTableVue :dataFilter="dataFilter" :searchstate="searchstate"
                    @update-keyscolumn="onUpdateKeyscolumn" />
            </div>
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
import { reportEventsApi } from '@/api/ReportEventsService';
import { findAllEventsApi } from '@/api/EventsService';
import { findAllClientsApi } from '@/api/UsersService';
import ServerTableVue from '@/components/reports/ServerTable.vue';
import { basicAlert } from '@/helpers/SweetAlert';
import { onMounted, ref } from 'vue';
import store from '@/store';
import * as XLSX from 'xlsx';

export default ({
    components: {
        ServerTableVue,
    },
    setup() {
        const listEventsData = ref([]);
        const listClientsData = ref([]);
        const dateFrom = ref('');
        const userFilter = ref('');
        const dateTo = ref('');
        const keyscolumn = ref([]);
        const plate = ref('');
        const type_event = ref('');
        const state = ref('');
        const searchstate = ref(false);
        const dataFilter = ref({});
        const dialogLoader = ref(false);

        onMounted(async () => {
            const [eventsResponse, clientsResponse] = await Promise.all([
                findAllEventsApi(store.state.codcuenta, store.state.codclienteAdmin),
                findAllClientsApi(store.state.codcuenta, store.state.empresa)
            ])
            listEventsData.value = eventsResponse.data.data ? eventsResponse.data.data[0].eventos : []
            listClientsData.value = clientsResponse.data.data ? clientsResponse.data.data.filter(client => client.rol != "Administrador") : []
        })

        const searchEventsReport = () => {
            if (dateFrom.value != "" && dateTo.value != "") {
                searchstate.value = true
                dataFilter.value = {
                    dateFrom: dateFrom.value,
                    dateTo: dateTo.value,
                    plate: plate.value,
                    userFilter: userFilter.value == 'Todos' ? '' : userFilter.value,
                    type_event: type_event.value == 'Todos' ? '' : type_event.value,
                    state: state.value == 'Todos' ? '' : state.value
                }
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Los campos fecha desde y fecha hasta son obligatorios')
            }
        }

        const customColumnNames = {
            cod_evento: 'EVENTO',
            placa: 'PLACA',
            prioridad: 'PRIORIDAD',
            fleet_name: 'FLOTA',
            empresa: 'EMPRESA',
            conductor: 'CONDUCTOR',
            fecha_actual: 'FEC. EVENTO',
            hora_evento : 'HORA EVENTO',
            latitud: 'LAT',
            longitud: 'LOG',
            velocidad: 'VELOCIDAD',
            geocerca: 'GEOCERCA',
            direccion: 'DIRECCION',
            fecha_ultima_accion: 'FEC. ATENCION',
            hora_ultima_accion: 'HORA ATENCION',
            descripcion_estado: 'ESTADO',
            usuario: 'USUARIOs',
            nombre: 'NOMBRE DE USUARIO',
            segundos: 'TIEMPO DE ATENCION',
            list_comentario: 'COMENTARIO',
         
           
        };

        const exportReports = async () => {
            if (dateFrom.value != "" && dateTo.value != "") {
                if (keyscolumn.value.length > 0) {
                    dialogLoader.value = true
                    const filterExcel = {
                        fecha_inicio: dateFrom.value,
                        fecha_fin: dateTo.value,
                        placa: plate.value,
                        cod_evento: type_event.value == 'Todos' ? '' : type_event.value,
                        descripcion_estado: state.value == 'Todos' ? '' : state.value,
                        // usuario: userFilter.value == 'Todos' ? '' : userFilter.value,

                       

                    }
                    reportEventsApi(store.state.codcuenta, store.state.codclienteAdmin, filterExcel.placa,
                        filterExcel.cod_evento, filterExcel.descripcion_estado, filterExcel.fecha_inicio, filterExcel.fecha_fin, 0, 0 , filterExcel.usuario) //
                        .then(response => {
                            const datos = response.data.data
                            const excelData = datos.map((obj, index) => {
                                const [fecha_ultima_accion, hora_ultima_accion] = obj.fecha_ultima_accion.split(" ");
                                
                                obj.list_comentario = obj.list_comentarios && obj.list_comentarios.length > 0
                                    ? obj.list_comentarios[obj.list_comentarios.length - 1].comentario
                                    : ''
                                    
                                    obj.nombre = obj.list_comentarios && obj.list_comentarios.length > 0
                                    ? obj.list_comentarios[obj.list_comentarios.length - 1].nombre_completo
                                    : ''


                                    
                                obj.fecha_ultima_accion = fecha_ultima_accion
                                obj.hora_ultima_accion = hora_ultima_accion
                           
                             
                    
                                const [fecha_actual,hora_evento ] = obj.fecha_actual.split(" ");
                               obj.fecha_actual= fecha_actual;

                               
                                
                            
                               obj.hora_evento= hora_evento
                                
                                const empresa = obj.placa.split(' - ')[1] || '';
                                // Agregar la columna "Empresa" al objeto exportado
                                const segundos = Math.abs(obj.segundos) >= 60 ? Math.floor(Math.abs(obj.segundos) / 60) + ' min ' + (Math.abs(obj.segundos) % 60) + ' s' : Math.abs(obj.segundos) + ' s'; 
                                 obj.segundos = segundos; 
                                const exportObj = {
                                    ...obj,
                                    empresa: empresa,
                                    placa: obj.placa.replace(` - ${empresa}`, ''),
                                    

                                    
                                };

                                // Filtrar solo las propiedades que están en keysAFiltrar y están presentes en obj
                                const filteredProperties = Object.fromEntries(
                                    keyscolumn.value
                                        .filter(key => Object.keys(exportObj).includes(key))
                                        .map(key => [customColumnNames[key] || key, exportObj[key]])
                                );

                                const idColumn = { ID: index + 1 };

                                return { ...idColumn, ...filteredProperties };
                            });

                            // Crear una hoja de cálculo de Excel
                            const workbook = XLSX.utils.book_new();
                            // Convertir la matriz de datos a una hoja de cálculo de Excel
                            const worksheet = XLSX.utils.json_to_sheet(excelData);
                            // Agregar la hoja de cálculo al libro de trabajo
                            const sheetName = 'DatosReportes';
                            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

                            // Guardar el archivo de Excel
                            XLSX.writeFile(workbook, 'Reporte(' + filterExcel.fecha_inicio + '/' + filterExcel.fecha_fin + ').xlsx', { bookType: 'xlsx', type: 'buffer' });
                            dialogLoader.value = false
                        })
                } else {
                    basicAlert(() => { }, 'warning', 'Advertencia', 'No hay un filtro de columnas registrado, genérelo al dar clic en el botón buscar')
                }
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Los campos fecha desde y fecha hasta son obligatorios')
            }
        }



        const onUpdateKeyscolumn = (data) => {
            keyscolumn.value = data.keyscolumn
        }

        return {
            dateFrom,
            dateTo,
            userFilter,
            plate,
            type_event,
            state,
            listClientsData,
            dialogLoader,
            listEventsData,
            dataFilter,
            searchstate,
            exportReports,
            searchEventsReport,
            onUpdateKeyscolumn,


        }
    }
})
</script>
<style>
.container_filters {
    display: grid;
    gap: 20px;
}

.custom-btn {
    width: 100px;
    /* Cambia este valor según el ancho deseado */
}

@media screen and (min-width: 1690px) {
    .container_filters {
        width: 90%;
        grid-template-columns: repeat(6, 1fr);
    }
}

@media screen and (max-width: 1690px) and (min-width: 1450px) {
    .container_filters {
        grid-template-columns: repeat(5, 1fr);
    }
}

@media screen and (max-width: 1450px) and (min-width: 1200px) {
    .container_filters {
        grid-template-columns: repeat(4, 1fr);
    }
}
</style>