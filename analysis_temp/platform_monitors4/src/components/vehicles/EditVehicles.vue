<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Editar vehículo</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Placa" prepend-inner-icon="mdi-card-bulleted" color="indigo"
                        v-model="plate" hide-details></v-text-field>
                    <v-switch label="Estado" v-model="estado" color="blue" hide-details></v-switch>
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
        const plate = ref('');
        const estado = ref(false);

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                plate.value = newVal.item.placa
                estado.value = newVal.item.status
            }
        })

        const editItem = () => {
            emit('edit-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codcliente,
                cod_unidad: props.itemEdit.item.cod_unidad,
                placa: plate.value,
                status: estado.value,
            })
            plate.value = ""
            estado.value = false
            cancelItem()
        }

        const cancelItem = () => {
            emit('cancel-item')
        }

        return {
            dialog,
            plate,
            estado,
            editItem,
            cancelItem
        }
    }
}
</script>