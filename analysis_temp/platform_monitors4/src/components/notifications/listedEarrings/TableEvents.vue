<template>
  <v-data-table item-value="ID" v-model="selected" :items="desserts" :headers="listedHeaders"
    :sort-by="[{ key: 'fecha_actual', order: 'desc' }]" show-select class="text-sm table_events" :search="search">
    <template v-slot:[`item.fecha`]="{ item }">
      <span>
        {{ item.fecha }} {{ item.hora }}
      </span>
    </template>

    <template v-slot:[`item.prioridad`]="{ item }">
      <div class="flex justify-center">
        <div class="h-5 w-5 rounded-full mr-2" :class="{
          'bg-orange-400': item.prioridad === 'URGENTE',
          'bg-red-400': item.prioridad === 'CRITICO',
          'bg-blue-400': item.prioridad === 'REGULAR'
        }">
        </div>
      </div>
    </template>

    <template v-slot:[`item.actions`]="{ item }">
      <div class="flex gap-1">
        <span @click="editItem(item)">
          <v-btn size="small" variant="text" color="green">
            <img :src="imgAttendedIcon" alt="" class="w-7 h-6">
          </v-btn>
          <v-tooltip activator="parent" location="top">Atender</v-tooltip>
        </span>
        <div>
          <div v-if="item.link_video == '' && item.link_imagen == ''">
            <v-btn size="x-small" icon="mdi-video" color="grey">
            </v-btn>
            <v-tooltip activator="parent" location="top">No hay evidencias</v-tooltip>
          </div>
          <div v-else>
            <v-btn icon="mdi-video" size="x-small" color="indigo-lighten-2"
              @click="seeEvidence(item.link_imagen, item.link_video)">
            </v-btn>
            <v-tooltip activator="parent" location="top">Ver evidencias</v-tooltip>
          </div>
        </div>
      </div>
    </template>
  </v-data-table>
</template>

<script>
// import ImgEvidencia from '@/assets/events/evidencias.jpg';
import ImgAttendedIcon from '@/assets/events/icon_atended.png';
import { convertVideoApi } from '@/api/VideoService';
import { ref, watch } from 'vue';
import { VDataTable } from 'vuetify/labs/VDataTable';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import store from '@/store';

export default {
  props: {
    search: String,
    desserts: Array,
    listedHeaders: Array
  },
  data() {
    return {
      imgAttendedIcon: ImgAttendedIcon,
    }
  },
  components: {
    VDataTable,
  },
  emits: ['selected-events'],
  setup(_, { emit }) {
    const selected = ref([]);
    const router = useRouter();
    const loadingModal = ref(null);

    const showLoadingModal = () => {
      loadingModal.value = Swal.fire({
        title: 'Construyendo Video...',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        },
      });
    };

    const hideLoadingModal = () => {
      if (loadingModal.value) {
        loadingModal.value.close();
      }
    };

    const seeEvidence = async (link_img, link_video) => {
      // Función para mostrar el modal de imagen
      const showImageModal = () => {
        Swal.fire({
          html: `<img src="${link_img}" alt="" class=w-full>`,
          showCancelButton: true,
          cancelButtonText: 'Volver al menú',
          confirmButtonText: 'Cerrar',
          confirmButtonColor: '#6D68B8',
          reverseButtons: true
        }).then((result) => {
          if (result.isConfirmed) {
            // Cerrar el modal de la imagen
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            // Volver al menú anterior (el modal principal)
            seeEvidence(link_img, link_video);
          }
        });
      };

      // Función para mostrar el modal de video
      const showVideoModal = async () => {
        showLoadingModal(); // Mostrar modal de carga

        try {
          const responsevideo = await convertVideoApi(link_video);
          const newLinkVideo = 'http://143.244.144.235:3020' + responsevideo.data.video_url;
          hideLoadingModal(); // Ocultar modal de carga
          Swal.fire({
            html: `
              <div class="flex justify-center">
                <video width="400" height="320" controls autoplay preload="auto"> 
                  <source src="${newLinkVideo}" type="video/mp4" codecs="hevc">
                </video>
              </div>`,
            showCloseButton: true,
            showCancelButton: true,
            cancelButtonText: 'Volver al menú',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#6D68B8',
            reverseButtons: true
          }).then((result) => {
            if (result.isConfirmed) {
              // Cerrar el modal del video
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              // Volver al menú anterior (el modal principal)
              seeEvidence(link_img, link_video);
            }
          });
        } catch (error) {
          hideLoadingModal(); // Ocultar modal de carga en caso de error
          console.error('Error al obtener la nueva URL del video:', error);
        }
      };

      // Crear el modal principal con opciones "Ver imagen" y "Ver video"
      Swal.fire({
        html: `<p class="text-x1 font-bold pt-10 text-gray-500">Ver evidencias disponibles</p>
          `,

          // <div class="w-full flex justify-center">
          //   <img src="${ImgEvidencia}" alt="" class=w-[50%]>
          // </div>
        showCancelButton: true,
        confirmButtonText: 'Ver imagen',
        cancelButtonText: 'Ver video',
        reverseButtons: true,
        focusConfirm: false,
        confirmButtonColor: '#6D68B8',
        focusCancel: false,
      }).then(async (result) => {
        // Manejar la lógica según la opción seleccionada
        if (result.isConfirmed) {
          if (link_img !== '') {
            showImageModal(); // Mostrar modal de imagen
          } else {
            Swal.fire({
              html: `<p class="pt-4">No hay imagen disponible</p>`,
              showCancelButton: true,
              reverseButtons: true,
              confirmButtonColor: '#6D68B8',
              cancelButtonText: 'Volver al menú',
              confirmButtonText: 'Cerrar',
            }).then((result) => {
              if (result.isConfirmed) {
                // Cerrar el modal del video
              } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Volver al menú anterior (el modal principal)
                seeEvidence(link_img, link_video);
              }
            });
          }
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          if (link_video !== '') {
            showVideoModal(); // Mostrar modal de video
          } else {
            Swal.fire({
              html: `<p class="pt-4">No hay video disponible</p>`,
              showCancelButton: true,
              reverseButtons: true,
              confirmButtonColor: '#6D68B8',
              cancelButtonText: 'Volver al menú',
              confirmButtonText: 'Cerrar',
            }).then((result) => {
              if (result.isConfirmed) {
                // Cerrar el modal del video
              } else if (result.dismiss === Swal.DismissReason.cancel) {
                // Volver al menú anterior (el modal principal)
                seeEvidence(link_img, link_video);
              }
            });
          }
        }
      });
    };

    watch(() => selected.value, (newVal) => {
      emit('selected-events', { selected: newVal })
    })

    const editItem = (data) => {
      store.commit('setEventAtended', data);
      router.push('/atenderevento');
    }

    return {
      selected, seeEvidence, editItem
    }
  }
}
</script>

<style>
.table_events {
  color: #797979 !important;
  font-size: 0.8rem;
}

.table_events table thead th {
  font-weight: bolder;
  color: #383838 !important
}
</style>
