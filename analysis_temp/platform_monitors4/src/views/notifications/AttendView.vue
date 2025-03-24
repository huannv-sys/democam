<template>
    <div>
        <h1 class="font-bold text-xl title_poppins pb-5">
            <router-link to="/pendienteslistados">
                <span>
                    <v-btn icon="mdi-chevron-left" variant="text"></v-btn>
                    <v-tooltip activator="parent" location="top">Regresar</v-tooltip>
                </span>
            </router-link>
            Atender evento
        </h1>
        <div class="w-full rounded-lg bg-white shadow-md p-5 block lg:grid lg:grid-cols-2 gap-4">
            <div>
                <div class="font-bold text-blue-500 pb-3 block md:flex md:justify-between">
                    <span><v-icon>mdi-text-box-search-outline</v-icon> Detalles</span>
                    <v-btn variant="tonal" :class="getPriorityColor(editEvent.prioridad)" class="mt-2 md:mt-0"> {{
                        editEvent.descripcion_evento }}
                    </v-btn>
                   
                </div> 
                <div class="block md:grid md:grid-cols-2 lg:grid lg:grid-cols-3 gap-2 text-gray-600 text-sm">
                    <div>
                        <p>Placa</p>
                        <div class="bg-gray-200 p-2 px-4 rounded-md">{{ editEvent.placa }}</div>
                    </div>
                    <div>
                        <p>Velocidad</p>
                        <div class="bg-gray-200 p-2 px-4 rounded-md">{{ editEvent.velocidad }}</div>
                    </div>
                    <div>
                        <p>Fecha recepción</p>
                        <div class="bg-gray-200 p-2 px-4 rounded-md">{{ editEvent.fecha }} {{ editEvent.hora }}</div>
                    </div>
                    <div>
                        <p>Origen</p>
                        <div class="bg-gray-200 p-2 px-4 rounded-md">{{ editEvent.origen }}
                        </div>
                    </div>
                    <div>
                        <p>Conductor</p>
                        <div class="bg-gray-200 p-2 px-4 rounded-md">{{ editEvent.conductor ? editEvent.conductor : "-" }}
                        </div>
                    </div>
                    <div>
                        <p>Flota</p>
                        <div class="bg-gray-200 p-2 px-4 rounded-md">{{ editEvent.fleet_name ? editEvent.fleet_name : "-" }}
                        </div>
                    </div>
                </div>
                <p class="font-bold text-blue-500 pb-3 pt-3"> <v-icon>mdi-comment-text-multiple</v-icon> Registrar
                    comentarios</p>
                <div class="block md:grid md:grid-cols-3 lg:grid lg:grid-cols-5 gap-1 pb-3">
                    <v-btn color="yellow-darken-4" size="small" @click="updateEventStatus('En Gestion')"
                        class="my-1 md:my-0">En gestión</v-btn>
                    <v-btn color="indigo" size="small" @click="updateEventStatus('Confirmado')"
                        class="my-1 md:my-0">Confirmado</v-btn>
                    <v-btn color="red" size="small" @click="updateEventStatus('Descartado')"
                        class="my-1 md:my-0">Descartado</v-btn>
                    <EscalateEventVue @send-email="onSendEmail" />
                </div>
                <v-textarea label="Agregue un comentario" variant="outlined" prepend-inner-icon="mdi-text-box-outline"
                    color="indigo" rows="3" v-model="comment"></v-textarea>
                <div class="block md:grid md:grid-cols-3 lg:grid lg:grid-cols-3 gap-1 pb-2">
                    <div v-for="answer in answersData" :key="answer.codigo" @click="insertComment(answer.text)">
                        <v-btn color="light-blue-darken-1" size="small" class="w-full">
                            {{ answer.sigla.length > 20 ? answer.sigla.slice(0, 20) + '...' : answer.sigla }}</v-btn>
                        <v-tooltip activator="parent" location="top">{{ answer.sigla }}</v-tooltip>
                    </div>
                </div>
            </div>
            <div class="overflow-hidden">
                <p class="font-bold text-blue-500 pb-4"> <v-icon>mdi-sign-direction</v-icon> Ubicación</p>
                <EventMapVue :longitud="longitud" :latitud="latitud" />
            </div>
            <div class="p-4">
                <p class="font-bold text-blue-500 pb-4"> <v-icon>mdi-table-check</v-icon> Registro de comentarios</p>
                <v-data-table-virtual :headers="headers" :items="dataComments" density="compact"
                    class="text-sm border"></v-data-table-virtual>
            </div>
            <div class="p-4 flex flex-col items-center">
    <p class="font-bold text-blue-500 pb-4"><v-icon>mdi-image-edit-outline</v-icon> Evidencias</p>
    <div class="flex">
        <div class="pr-4">
            <img :src="editEvent.link_imagen" alt="">
        </div>
        <div class="video-container">
            <video :src="editEvent.link_video" autoplay controls class="custom-video"></video>
        </div>
    </div>
</div>

        </div>
    </div>
</template>
<script>

/* eslint-disable */
import { addCommentEventsApi, notificationsByIdApi } from '@/api/NotificationsService';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { findAllAnswersApi } from '@/api/AnswersService';
import { findAllEventsApi } from '@/api/EventsService';
import { sendEmailsApi } from '@/api/EmailService';
import { onMounted, ref } from 'vue';
import EventMapVue from '@/components/notifications/EventMap.vue';
import { VDataTableVirtual } from 'vuetify/labs/VDataTable';
import EscalateEventVue from '@/components/notifications/EscalateEvent.vue';
import { useRouter } from 'vue-router';
import store from '@/store';

export default ({
    components: {
        EventMapVue,
        VDataTableVirtual,
        EscalateEventVue
    },
    setup() {
        const editEvent = ref({});
        const latitud = ref('');
        const longitud = ref('');
        const listEventsData = ref([]);
        const answersData = ref([]);
        const comment = ref('')
        const currentDateTime = ref('');
        const dataComments = ref([]);
        const router = useRouter();

        const headers = [
            { title: 'Comentario', align: 'start', key: 'comentario' },
            { title: 'Estado', align: 'start', key: 'descripcion_estado' },
            { title: 'Usuario', align: 'start', key: 'usuario' },
            { title: 'Fecha', align: 'start', key: 'fecha_envio' },
        ]

        const getCurrentDateTime = () => {
            const currentDate = new Date();
            const formattedDate = formatDate(currentDate);
            const formattedTime = formatTime(currentDate);
            currentDateTime.value = `${formattedDate} ${formattedTime}`;
        };

        const formatDate = (date) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        };

        const formatTime = (date) => {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const seconds = date.getSeconds().toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        };

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            editEvent.value = store.state.eventAtended
            dataComments.value = editEvent.value.list_comentarios
            latitud.value = editEvent.value.latitud
            longitud.value = editEvent.value.longitud
            const [responseAnswer, responseEvents] = await Promise.all([
                findAllAnswersApi(store.state.codclienteAdmin),
                findAllEventsApi(store.state.codcuenta, store.state.codclienteAdmin)
            ])
            answersData.value = responseAnswer.data.data ? responseAnswer.data.data[0].respuestas : []
            listEventsData.value = responseEvents.data.data ? responseEvents.data.data[0].eventos : []
        }

        const getPriorityColor = (prioridad) => {
            if (prioridad && listEventsData.value.length > 0) {
                switch (prioridad) {
                    case 'REGULAR':
                        return 'regular-color-class';
                    case 'URGENTE':
                        return 'urgent-color-class';
                    case 'CRITICO':
                        return 'critical-color-class';
                    default:
                        return '';
                }
            }
        }

        const insertComment = (text) => {
            comment.value = text
        }

        const updateEventStatus = (status) => {
            getCurrentDateTime()
            const data = {
                "id": editEvent.value.ID,
                "comentario": comment.value,
                "fecha_envio": currentDateTime.value,
                "descripcion_estado": status,
                "rol": store.state.rol,
                "usuario": store.state.username
            }
            if (comment.value != "") {
                confirmBasic(async () => {
                    addCommentEventsApi(data)
                        .then(() => {
                            basicAlert(async () => {
                                if (status == "En Gestion") {
                                    const payload = {
                                        "id": editEvent.value.ID,
                                        "cod_cuenta": store.state.codcuenta,
                                        "cod_cliente": store.state.codclienteAdmin,
                                    }
                                    notificationsByIdApi(payload)
                                        .then(response => {
                                            dataComments.value = response.data.data.list_comentarios
                                            comment.value = ""
                                        })
                                } else {
                                    router.push('/pendienteslistados');
                                }
                            }, 'success', 'Logrado', 'Se agrego el comentario correctamente')
                        })
                        .catch(() => {
                            basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro agregar el comentario')
                        })
                }, '¿Estás seguro de agregar este comentario?', 'Aceptar');
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'No se registro un comentario')
            }
        }

        const onSendEmail = (data) => {
            const payload = {
                "id": editEvent.value.ID,
                "cod_cuenta": store.state.codcuenta,
                "cod_cliente": store.state.codclienteAdmin,
                "to": data.selectedEmail
            };
            sendEmailsApi(payload)
                .then(() => {
                    basicAlert(async () => { }, 'success', 'Logrado', 'Se escalo el evento correctamente')
                })
        }

        return {
            updateEventStatus,
            getPriorityColor,
            insertComment,
            dataComments,
            onSendEmail,
            comment,
            editEvent,
            answersData,
            latitud,
            longitud,
            headers
        }
    }
})
</script>
<style>
/* Clase para prioridad REGULAR */
.regular-color-class {
    background-color: #60a5fa;
    /* Color de fondo para prioridad REGULAR */
    color: white;
    /* Color del texto para prioridad REGULAR */
}

/* Clase para prioridad URGENTE */
.urgent-color-class {
    background-color: #fb923c;
    /* Color de fondo para prioridad URGENTE */
    color: white;
    /* Color del texto para prioridad URGENTE */
}

/* Clase para prioridad CRITICO */
.critical-color-class {
    background-color: #f87171;
    /* Color de fondo para prioridad CRITICO */
    color: white;
    /* Color del texto para prioridad CRITICO */
}
</style>   

<style scoped>
    .video-container {
        position: relative;
        width: 100%;
        max-width: auto; /* Ajusta según tus preferencias */
    }

    .video-container video {
        width: 100%;
        height: auto;
    }
    .pr-4{
        position: relative;
        width: 100%;
        max-width: auto;  
    }

    .pr-4 img {
        width: 100%;
        height: auto;

    }
</style>