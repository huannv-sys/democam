<template>
 
      <h1 class="font-bold text-xl title_poppins pb-5">Eventos pendientes</h1>
      <div class="w-full rounded-lg bg-white shadow-md">
        <div class="p-5">
<div class="rounded-lg overflow-hidden shadow mb-3">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title color="indigo-lighten-2" class="rounded-md">
                  <div class="flex items-center">
                    <v-icon>mdi-filter-menu</v-icon>
                    <span class="pl-5">Seleccionar columnas</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text class="rounded-md">
                  <div class="lg:grid lg:grid-cols-10 md:grid md:grid-cols-6 grid grid-cols-3 gap-1">
                    <v-checkbox
                      v-for="item in listedHeaders.filter(header => header.key != 'actions')"
                      v-model="selectedColumns" color="blue" :value="item.key" hide-details
                      :key="item.key">
                      <template v-slot:label>
                        <span class="text-xs">
                          {{ item.title }}
                        </span>
                      </template>
                    </v-checkbox>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          <div class="w-full flex justify-between pt-4">
            <div class="lg:w-[30%] pb-4 w-full">
              <v-text-field clearable color="indigo" v-model="search" prepend-inner-icon="mdi-magnify"
                label="Buscar" hide-details density="compact" variant="outlined"></v-text-field>
            </div>
            <div class="lg:w-[56%] w-full block lg:grid lg:grid-cols-5 gap-4">
              <!-- <v-select label="Orden" :items="['Ascendente', 'Descendente']" variant="outlined" density="compact"
                color="indigo" prepend-inner-icon="mdi-calendar-range" class="col-span-2"
                v-model="order"></v-select> -->
              <v-select label="Tipo de eventos" :items="eventCodes" variant="outlined" density="compact"
                color="indigo" prepend-inner-icon="mdi-format-list-bulleted-type" class="col-span-3"
                v-model="eventfilter"></v-select>
            </div>
            <div>
              <v-btn color="red" size="small" @click="onMassDiscard"><v-icon>mdi-bell-remove</v-icon> Descarte
                  masivo</v-btn>
            </div>
          </div>
          <TableEventsVue :desserts="listEventsFilter" :listedHeaders="listedHeadersFilter" :search="search"
            @selected-events="onSelectedEvents" />
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
  import TableEventsVue from "@/components/notifications/listedEarrings/TableEvents.vue";
  import { notificationsAccountApi, massDiscardofEventsApi } from '@/api/NotificationsService';
  import { confirmBasic, basicAlert } from '@/helpers/SweetAlert';
  import { onMounted, ref, watch, onUnmounted } from "vue"
  import store from "@/store";
  
  export default {
    name: "ListedEarringsView",
    components: {
      TableEventsVue
    },
    setup() {
        const listEventsFilter = ref([]);
      const search = ref('');
      const selectedDiscardEvents = ref([]);
      const pendingEvents = ref([]);
      const dialogLoader = ref(false);
      const selectedColumns = ref(store.state.selectedColumnsNotifications);
      const listedHeaders = ref([
        { title: 'Desc. evento', align: 'start', key: 'descripcion_evento', sortable: true },
        { title: 'Placa', align: 'start', key: 'placa', sortable: true },
        { title: 'Conductor', align: 'start', key: 'conductor', sortable: true },
        { title: 'Flota', align: 'start', key: 'fleet_name', sortable: true },
        { title: 'Fecha evento', align: 'start', key: 'fecha', sortable: true },
        { title: 'Fecha recepción', align: 'start', key: 'fecha_actual', sortable: true },
        { title: 'Velocidad', align: 'start', key: 'velocidad', sortable: true },
        { title: 'Dirección', align: 'start', key: 'direccion', sortable: true },
        { title: 'Estado', align: 'start', key: 'descripcion_estado', sortable: true },
        { title: 'Última acción', align: 'start', key: 'fecha_ultima_accion', sortable: true },
        { title: 'Prioridad', align: 'center', key: 'prioridad', sortable: true },
        { title: 'Acciones', align: 'start', key: 'actions', sortable: true }
      ]);
  
      const listedHeadersFilter = ref([]);
      const eventCodes = ref([]);
      const order = ref('Descendente');
      const eventfilter = ref('Todos');
  
      const addSiglaHeaderIfNeeded = () => {
        if (store.state.codclienteAdmin === 'All') {
          listedHeaders.value.unshift({ title: 'Sigla cliente', align: 'start', key: 'sigla_cliente', sortable: true });
          selectedColumns.value.unshift('sigla_cliente')
          if (store.state.codcuenta === '0000') {
            listedHeaders.value.unshift({ title: 'Sigla cuenta', align: 'start', key: 'sigla_cuenta', sortable: true });
            selectedColumns.value.unshift('sigla_cuenta')
            selectedColumns.value = selectedColumns.value.filter(column => column !== 'actions' && column !== 'fecha_ultima_accion');
          }
        }
      };
  
      const loadData = async () => {
        const responseEvent = await notificationsAccountApi(store.state.codcuenta, store.state.codclienteAdmin, store.state.username, store.state.codregla);
        pendingEvents.value = responseEvent.data.data ? responseEvent.data.data.filter(event => {
          return event.descripcion_estado === "Sin Atender" || event.descripcion_estado === "En Gestion";
        }) : [];
        const uniqueEventCodes = [...new Set(pendingEvents.value.map((event) => event.descripcion_evento))];
        uniqueEventCodes.unshift('Todos');
        eventCodes.value = uniqueEventCodes;
      };
  
      const intervalId = setInterval(() => {
        loadData();
      }, 15000);
  
      onUnmounted(() => {
        clearInterval(intervalId);
      });
  
      onMounted(async () => {
        dialogLoader.value = true;
        addSiglaHeaderIfNeeded();
        await loadData();
        updateColumnVisibility();
        filterEvents();
        dialogLoader.value = false;
      });
  
      const updateColumnVisibility = () => {
        listedHeadersFilter.value = listedHeaders.value.filter(item => {
          return store.state.selectedColumnsNotifications.includes(item.key);
        });
      };
  
      watch(() => selectedColumns.value, () => {
        store.commit('setSelectedColumnsNotifications', selectedColumns.value);
        updateColumnVisibility();
      });
  
      watch(() => order.value, async () => {
        await filterEvents();
      });
  
      watch(() => eventfilter.value, async () => {
        await filterEvents();
      });
  
      const filterEvents = async () => {
        if (eventfilter.value !== 'Todos') {
          listEventsFilter.value = pendingEvents.value.filter(event => event.descripcion_evento === eventfilter.value);
        } else {
          listEventsFilter.value = pendingEvents.value;
        }
        if (order.value === 'Descendente') {
          listEventsFilter.value.sort((a, b) => {
            const dateA = new Date(a.fecha_actual);
            const dateB = new Date(b.fecha_actual);
            return dateB - dateA;
          });
        } else {
          listEventsFilter.value.sort((a, b) => {
            const dateA = new Date(a.fecha_actual);
            const dateB = new Date(b.fecha_actual);
            return dateA - dateB;
          });
        }
      };
  
      const onSelectedEvents = (data) => {
        selectedDiscardEvents.value = data.selected;
      };
  
      const onMassDiscard = () => {
          if (selectedDiscardEvents.value.length > 0) {
              confirmBasic(async () => {
                  massDiscardofEventsApi(selectedDiscardEvents.value, store.state.codcuenta, store.state.codclienteAdmin)
                      .then(() => {
                          basicAlert(async () => {
                              await loadData();
                              await filterEvents();
                          }, 'success', 'Logrado', 'Se ha descartado los eventos correctamente')
                      })
                      .catch(() => {
                          basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro descartar los eventos')
                      })
              }, '¿Estás seguro de realizar el descarte de los eventos seleccionados?', 'Aceptar');
          } else {
              basicAlert(() => { }, 'warning', 'Advertencia', 'No se ha encontrado eventos seleccionados para el descarte masivo')
          }
      }
  
      return {
           eventCodes,
            onMassDiscard,
            onSelectedEvents,
            dialogLoader,
            listedHeadersFilter,
            selectedColumns,
            pendingEvents,
            listedHeaders,
            eventfilter,
            listEventsFilter,
            search,
      };
    },
  };
  </script>
  
  <style scoped>
  .v-expansion-panel-title__overlay {
    background: transparent !important;
  }
  
  .v-selection-control .v-label {
    font-size: 10px !important;
  }
  
  .v-label {
    font-size: 10px !important;
  }
  </style>