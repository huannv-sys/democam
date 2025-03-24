<template>
    <v-btn size="small" color="blue" @click="dialog = true"><v-icon icon="mdi-plus"></v-icon>
        Crear Nuevo</v-btn>
    <v-dialog v-model="dialog" width="500">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Crear turno</span>
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
        const description = ref('');
        const fromHour = ref('');
        const toHour = ref('');

        const createItem = () => {
            emit('create-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codcliente,
                cod_turno: '',
                descripcion: description.value,
                desde: fromHour.value,
                hasta: toHour.value
            })
            description.value = fromHour.value = toHour.value = ""
            dialog.value = false
        }
        return {
            dialog,
            description,
            fromHour,
            toHour,
            createItem
        }
    }
}
</script>