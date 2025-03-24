<template>
  <v-card class="elevation-0">
    <v-container class="pa-2" fluid>
      <div class="grid gap-3">
        <v-card class="pb-3" border flat v-for="(item, index) in paginatedDesserts" :key="index">
          <div style="position: relative;">
            <!-- Checkbox -->
            <input
              type="checkbox"
              style="position: absolute; top: 10px; right: 10px; z-index: 2; transform: scale(1.3);"
              :value="item.ID"
              @change="toggleSelection(item.ID)"
            />
            <!-- Imagen -->
            <v-img :src="item.link_imagen || require('@/assets/events/imagen_vacia.jpg')" :max-height="item.link_imagen ? '' : '200'"></v-img>
          </div>

          <v-list-item class="mb-2" :subtitle="item.placa + ' - ' + item.conductor">
            <template v-slot:title>
              <strong class="text-md mb-2">{{ item.descripcion_evento }}</strong>
            </template>
          </v-list-item>

          <div class="d-flex justify-space-between px-4">
            <div class="d-flex align-center text-caption text-medium-emphasis me-1">
              <v-icon icon="mdi-clock" start></v-icon>
              <div class="text-truncate">{{ item.hora }}</div>
            </div>

            <!-- Botón para ver el video -->
            <v-btn @click="openVideoModal(item.link_video)" icon width="10" height="10">
              <v-icon >mdi-video</v-icon>
            </v-btn>
            <v-btn border flat size="small" class="text-none" color="indigo" text="Atender" @click="editItem(item)"></v-btn>

            
          </div>
        </v-card>
      </div>
      <v-pagination v-model="currentPage" :length="totalPages" rounded="circle" ></v-pagination>

      <!-- Modal para el video -->
      <v-dialog v-model="videoModal" width="500" >
        <v-card>
          <v-card-title>Video</v-card-title>
          <v-card-text >
            <!-- Embed del video -->
            <video :src="videoUrl" width="900" height="315" frameborder="0" allowfullscreen autoplay controls></video>
          </v-card-text>
          <v-card-actions>
            <!-- Botón para cerrar el modal -->
            <v-btn @click="closeVideoModal">Cerrar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </v-card>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import store from '@/store';
import { useRouter } from 'vue-router';
import { convertVideoApi } from '@/api/VideoService';
import Swal from 'sweetalert2';

export default {
  props: {
    dataEvents: Array,
  },
  emits: ['selected-events'],
  setup(props, { emit }) {
    const search = ref('');
    const currentPage = ref(1);
    const itemsPerPage = ref(18);
    const desserts = ref([]);
    const selectedDiscardEvents = ref(new Set());
    const selected = ref([]);
    const router = useRouter();
    // const loadingModal = ref();
    let loadingModal = null;
    onMounted(() => {
      desserts.value = props.dataEvents;
    });

    watch(() => props.dataEvents, (newVal) => {
      desserts.value = newVal;
    });

    const paginatedDesserts = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      return desserts.value.slice(startIndex, endIndex);
    });

    const totalPages = computed(() => {
      return Math.ceil(desserts.value.length / itemsPerPage.value);
    });

    const goToPage = (pageNumber) => {
      currentPage.value = pageNumber;
    };

    const toggleSelection = (itemId) => {
      if (selectedDiscardEvents.value.has(itemId)) {
        selectedDiscardEvents.value.delete(itemId);
      } else {
        selectedDiscardEvents.value.add(itemId);
      }
      emit('selected-events', { selected: Array.from(selectedDiscardEvents.value) });
    };

    const editItem = (data) => {
      store.commit('setEventAtended', data);
      router.push('/atenderevento');
    };

    // Estado para el modal del video
    const videoModal = ref(false);

    // URL del video
    const videoUrl = ref('');

    // Método para abrir el modal del video
    // const showLoadingModal = () => {
    //   loadingModal.value = Swal.fire({
    //     title: 'Construyendo Video...',
    //     allowOutsideClick: false,
    //     showConfirmButton: false,
    //     willOpen: () => {
    //       Swal.showLoading();
    //     },
    //   });
    // };

  //  const hideLoadingModal = () => {
  //     if (loadingModal.value) {
  //       loadingModal.value.close();
  //     }
  //   };




    const openVideoModal = async (url) => {
  try {
    // Mostrar mensaje "Construyendo Video..."
    const loadingModal = Swal.fire({
      title: 'Construyendo Video...',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    const response = await convertVideoApi(url); // Convertir el enlace del video
    videoUrl.value = 'http://143.244.144.235:3020' + response.data.video_url;
    videoModal.value = true; // Mostrar el modal del video con el nuevo enlace convertido

    // Cerrar el mensaje de carga después de completar la conversión
    loadingModal.close();
  } catch (error) {
    console.error('Error al convertir el enlace del video:', error);
    // Manejar el error aquí
    // Cerrar el mensaje de carga en caso de error
    if (loadingModal) {
      loadingModal.close();
    }
  }
};





  

    // Método para cerrar el modal del video
    const closeVideoModal = () => {
      videoModal.value = false;
      videoUrl.value = '';
     
    };

    return {
      search,
      desserts,
      currentPage,
      itemsPerPage,
      editItem,
      paginatedDesserts,
      totalPages,
      toggleSelection,
      goToPage,
      selected,
      openVideoModal,
      closeVideoModal,
      videoModal,
      videoUrl,
    };
  },
};
</script>



<style scoped>
/* Tus estilos originales aquí */
/* CSS para pantallas muy pequeñas (menos de 1250px) */
@media (max-width: 1249px) {
  .grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* CSS para pantallas pequeñas (entre 1250px y 1549px) */
@media (min-width: 1250px) and (max-width: 1549px) {
  .grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

/* CSS para pantallas medianas (entre 1550px y 1649px) */
@media (min-width: 1550px) and (max-width: 1649px) {
  .grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

/* CSS para pantallas grandes (1650px o más) */
@media (min-width: 1650px) {
  .grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

/* CSS para teléfonos móviles */
@media (max-width: 599px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
