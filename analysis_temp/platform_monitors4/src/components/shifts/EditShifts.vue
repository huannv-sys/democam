<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Editar turno</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Descripción" prepend-inner-icon="mdi-text-box-check-outline"
                        color="indigo" v-model="description"></v-text-field>
                    <v-text-field variant="outlined" label="Desde" prepend-inner-icon="mdi-account-clock" color="indigo"
                        v-model="fromHour" type="time"></v-text-field>
                    <v-text-field variant="outlined" label="Hasta" prepend-inner-icon="mdi-account-clock" color="indigo"
                        v-model="toHour" type="time"></v-text-field>
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
        const fromHour = ref('');
        const toHour = ref('');

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                description.value = newVal.item.descripcion
                fromHour.value = newVal.item.desde
                toHour.value = newVal.item.hasta
            }
        })

        const editItem = () => {
            emit('edit-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codcliente,
                cod_turno: props.itemEdit.item.cod_turno,
                descripcion: description.value,
                desde: fromHour.value,
                hasta: toHour.value
            })
            description.value = fromHour.value = toHour.value = ""
            cancelItem()
        }

        const cancelItem = () => {
            emit('cancel-item')
        }

        return {
            dialog,
            description,
            fromHour,
            toHour,
            editItem,
            cancelItem
        }
    }
}
</script>