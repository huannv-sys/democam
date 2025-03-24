<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Editar tipo de evento</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Codigo de evento" prepend-inner-icon="mdi-qrcode" color="indigo"
                        v-model="cod_evento" disabled></v-text-field>
                    <v-text-field variant="outlined" label="Descripción" prepend-inner-icon="mdi-text-box" color="indigo"
                        v-model="descripcion"></v-text-field>
                    <v-select prepend-inner-icon="mdi-priority-high" label="Prioridad"
                        :items="['REGULAR', 'URGENTE', 'CRITICO']" variant="outlined" class="col-span-2" color="indigo"
                        v-model="prioridad" hide-details></v-select>
                    <v-switch label="Estado" v-model="estado" color="blue" hide-details></v-switch>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-grey-lighten-2" variant="tonal" @click="cancelItem">
                    Cancelar
                </v-btn>
                <v-btn color="blue-lighten-1" variant="tonal" @click="editItem">
                    Aceptar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { ref, watch } from 'vue';
import store from '@/store';

export default {
    props: {
        itemEdit: Object,
        openModal: Boolean
    },
    emits: ['edit-item', 'cancel-item'],
    setup(props, { emit }) {
        const dialog = ref(false);
        const cod_evento = ref('');
        const descripcion = ref('');
        const prioridad = ref('');
        const estado = ref(false);

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                cod_evento.value = newVal.item.cod_evento
                descripcion.value = newVal.item.descripcion
                prioridad.value = newVal.item.prioridad
                estado.value = newVal.item.status
            }
        })

        const editItem = () => {
            emit('edit-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codclienteAdmin,
                cod_evento: cod_evento.value,
                descripcion: descripcion.value,
                fecha_creacion: props.itemEdit.item.fecha_creacion,
                prioridad: prioridad.value,
                usuario: store.state.username,
                status: estado.value
            })
            cod_evento.value = descripcion.value = prioridad.value = ""
            estado.value = false
            cancelItem();
        }

        const cancelItem = () => {
            emit('cancel-item')
        }

        return {
            dialog,
            cod_evento,
            descripcion,
            prioridad,
            estado,
            editItem,
            cancelItem
        }
    }
}
</script>