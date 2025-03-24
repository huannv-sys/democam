<template>
    <v-btn size="small" color="blue" @click="dialog = true"><v-icon icon="mdi-plus"></v-icon>
        Crear Nuevo</v-btn>
    <v-dialog v-model="dialog" width="500">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Crear respuesta predefinida</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Sigla" prepend-inner-icon="mdi-alphabetical-variant"
                        color="indigo" v-model="sigla"></v-text-field>
                    <v-textarea variant="outlined" label="Texto" prepend-inner-icon="mdi-text-box-check-outline"
                        color="indigo" v-model="text" rows="3"></v-textarea>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-grey-lighten-2" variant="tonal" @click="dialog = false">
                    Cancelar
                </v-btn>
                <v-btn color="blue-lighten-1" variant="tonal" @click="createItem">
                    Aceptar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { ref } from 'vue';
import store from '@/store';

export default {
    emits: ['create-item'],
    setup(_, { emit }) {
        const dialog = ref(false);
        const sigla = ref('');
        const text = ref('');

        const createItem = () => {
            emit('create-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codclienteAdmin,
                sigla: sigla.value,
                text: text.value
            })
            sigla.value = text.value = ""
            dialog.value = false
        }
        return {
            dialog,
            sigla,
            text,
            createItem
        }
    }
}
</script>