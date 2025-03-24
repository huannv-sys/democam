<template>
  <div>
      <h1 class="font-bold text-xl title_poppins pb-5">Eventos pendientes</h1>
      <div class="w-full rounded-lg bg-white shadow-md p-4">
          <div class="pl-2">
              <p class="text-xl text-gray-400">Realizar filtros</p>
              <div class="w-full block lg:flex lg:justify-between pt-3">
                  <div class="lg:w-[45%] w-full block lg:grid lg:grid-cols-5 gap-4">
                      <v-select label="Orden" :items="['Ascendente', 'Descendente']" variant="outlined" density="compact"
                          color="indigo" prepend-inner-icon="mdi-calendar-range" class="col-span-2"
                          v-model="order"></v-select>
                      <v-select label="Tipo de eventos" :items="eventCodes" variant="outlined" density="compact"
                          color="indigo" prepend-inner-icon="mdi-format-list-bulleted-type" class="col-span-3"
                          v-model="eventfilter"></v-select>
                  </div>
                  <v-btn color="red" size="small" @click="onMassDiscard"><v-icon>mdi-bell-remove</v-icon> Descarte
                      masivo</v-btn>
              </div>
          </div>
          <DataIteratorsVue :dataEvents="listEventsFilter" @selected-events="onSelectedEvents" />
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
import DataIteratorsVue from '@/components/notifications/iconsEarrings/DataIterators.vue';
import { notificationsAccountApi, massDiscardofEventsApi } from '@/api/NotificationsService';
import { confirmBasic, basicAlert } from '@/helpers/SweetAlert';
import { onMounted, ref, watch, onUnmounted } from 'vue';
import store from "@/store";

export default ({ 
  name: "IconsEarringsView",
  components: {
      DataIteratorsVue
  },
  setup() {
      const pendingEvents = ref([]);
      const listEventsFilter = ref([]);
      const order = ref('Descendente');
      const eventfilter = ref('Todos');
      const eventCodes = ref([]);
      const dialogLoader = ref(false);
      const selectedDiscardEvents = ref([]);

      onMounted(async () => {
          dialogLoader.value = true
          await loadData();
          await filterEvents(); 
          dialogLoader.value = false
      })

      const loadData = async () => {
          const responseEvent = await notificationsAccountApi(store.state.codcuenta, store.state.codclienteAdmin, store.state.username, store.state.codregla);
          pendingEvents.value = responseEvent.data.data ? responseEvent.data.data.filter(event => {
              return event.descripcion_estado === "Sin Atender" || event.descripcion_estado === "En Gestion";
          }) : []
          const uniqueEventCodes = [...new Set(pendingEvents.value.map((event) => event.descripcion_evento))];
          uniqueEventCodes.unshift('Todos');
          eventCodes.value = uniqueEventCodes;
      }


      const intervalId = setInterval(() => {
          loadData();
      }, 15000);

      onUnmounted(() => {
          clearInterval(intervalId);
      });


      watch(() => order.value, async () => {
          await filterEvents();
      })

      watch(() => eventfilter.value, async () => {
          await filterEvents();
      })

      const filterEvents = async () => {
          if (eventfilter.value !== 'Todos') {
              listEventsFilter.value = pendingEvents.value.filter(event => event.descripcion_evento === eventfilter.value);
          } else {
              listEventsFilter.value = pendingEvents.value
          }
          if (order.value == 'Descendente') {
              listEventsFilter.value.sort((a, b) => {
                  // Convertir las fechas a objetos Date para compararlas
                  const dateA = new Date(a.fecha_actual);
                  const dateB = new Date(b.fecha_actual);

                  // Ordenar de manera descendente basado en la fecha_actual
                  return dateB - dateA;
              });
          } else {
              // Ordenar de manera ascendente basado en la fecha_actual
              listEventsFilter.value.sort((a, b) => {
                  const dateA = new Date(a.fecha_actual);
                  const dateB = new Date(b.fecha_actual);
                  return dateA - dateB;
              });
          }
      }

      const onSelectedEvents = (data) => {
          selectedDiscardEvents.value = data.selected
      }

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
          onSelectedEvents,
          onMassDiscard,
          listEventsFilter,
          dialogLoader,
          pendingEvents,
          eventCodes,
          eventfilter,
          order
      }
  }
})

</script>