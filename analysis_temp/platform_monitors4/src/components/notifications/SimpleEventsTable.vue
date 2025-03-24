<template>
    <v-data-table :items="desserts" :headers="listedHeaders" :sort-by="[{ key: 'fecha_actual', order: 'desc' }]"
        class="text-sm table_events" :search="search">
        <template v-slot:[`item.fecha`]="{ item }">
            <span>
                {{ item.fecha }} {{ item.hora }}
            </span>
        </template>
        <template v-slot:[`item.prioridad`]="{ item }">
            <div class="flex justify-center">
                <div class="h-5 w-5 rounded-full mr-2" :class="{
                    'bg-orange-300': item.prioridad === 'URGENTE',
                    'bg-red-300': item.prioridad === 'CRITICO',
                    'bg-blue-300': item.prioridad === 'REGULAR'
                }">
                </div>
            </div>
        </template>
        <template v-slot:[`item.evidence`]="{ item }">
            <div class="flex gap-1 w-full justify-center">
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
        </template>
    </v-data-table>
</template>
<script>
import { VDataTable } from 'vuetify/labs/VDataTable';
import ImgEvidencia from '@/assets/events/evidencias.jpg';
import Swal from 'sweetalert2';

export default {
    props: {
        search: String,
        desserts: Array,
        listedHeaders: Array
    },
    components: {
        VDataTable,
    },
    setup() {
        const seeEvidence = (link_img, link_video) => {
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
            const showVideoModal = () => {
                Swal.fire({
                    html: `
              <div class="flex justify-center">
                <video width="400" height="320" controls>
                  <source src="${link_video}" type="video/mp4">
                </video>
              </div>
              `,
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
            };

            // Crear el modal principal con opciones "Ver imagen" y "Ver video"
            Swal.fire({
                html: `<p class="text-xl font-bold pt-1 text-gray-500">Ver evidencias disponibles</p>
        <div class="w-full flex justify-center">
        <img src="${ImgEvidencia}" alt="" class=w-[50%]>
        </div>
        `,
                showCancelButton: true,
                confirmButtonText: 'Ver imagen',
                cancelButtonText: 'Ver video',
                reverseButtons: true,
                focusConfirm: false,
                confirmButtonColor: '#6D68B8',
                focusCancel: false,
            }).then((result) => {
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

        return {
            seeEvidence
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