<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Editar procedimiento</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Evento" prepend-inner-icon="mdi-bell" color="indigo"
                        v-model="cod_evento" disabled></v-text-field>
                    <v-text-field variant="outlined" label="Nombre" prepend-inner-icon="mdi-form-textbox" color="indigo"
                        v-model="description"></v-text-field>
                    <v-textarea variant="outlined" label="Detalles" prepend-inner-icon="mdi-text-box-check-outline"
                        color="indigo" v-model="details" rows="5"></v-textarea>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-grey-lighten-2" variant="tonal" @click="dialog = false">
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
        const description = ref('');
        const details = ref('');
        const cod_evento = ref('');

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                description.value = newVal.item.descripcion
                details.value = newVal.item.detalles
                cod_evento.value = newVal.item.cod_evento
            }
        })

        const editItem = () => {
            emit('edit-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codcliente,
                cod_evento: props.itemEdit.item.cod_evento,
                descripcion: description.value,
                detalles: details.value
            })
            description.value = details.value = ""
            cancelItem()
        }

        const cancelItem = () => {
            emit('cancel-item')
        }

        return {
            dialog,
            description,
            cod_evento,
            details,
            editItem,
            cancelItem
        }
    }
}
</script>