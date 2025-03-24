<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Editar respuesta predefinida</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Sigla" prepend-inner-icon="mdi-alphabetical-variant" color="indigo"
                        v-model="sigla"></v-text-field>
                    <v-textarea variant="outlined" label="Texto" prepend-inner-icon="mdi-text-box-check-outline" color="indigo"
                        v-model="text" rows="3"></v-textarea>
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
        const sigla = ref('');
        const text = ref('');

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                sigla.value = newVal.item.sigla
                text.value = newVal.item.text
            }
        })

        const editItem = () => {
            emit('edit-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codclienteAdmin,
                codigo: props.itemEdit.item.codigo,
                sigla: sigla.value,
                text: text.value
            })
            sigla.value = text.value = ""
            cancelItem()
        }

        const cancelItem = () => {
            emit('cancel-item')
        }

        return {
            dialog,
            sigla,
            text,
            editItem,
            cancelItem
        }
    }
}
</script>