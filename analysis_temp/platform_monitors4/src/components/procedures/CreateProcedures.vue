<template>
    <v-btn size="small" color="blue" @click="dialog = true"><v-icon icon="mdi-plus"></v-icon>
        Crear Nuevo</v-btn>
    <v-dialog v-model="dialog" width="500">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Crear procedimiento</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-autocomplete label="Seleccionar evento" :items="dataEvents.map(event => event.cod_evento)" variant="outlined" color="indigo"
                        v-model="event" prepend-inner-icon="mdi-bell"></v-autocomplete>
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
                <v-btn color="blue-lighten-1" variant="tonal" @click="createItem">
                    Aceptar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { findAllEventsApi } from '@/api/EventsService';
import { ref, onMounted } from 'vue';
import store from '@/store';

export default {
    emits: ['create-item'],
    setup(_, { emit }) {
        const dialog = ref(false);
        const dataEvents = ref([]);
        const event = ref('');
        const description = ref('');
        const details = ref('');

        onMounted(() => {
            findAllEventsApi(store.state.codcuenta, store.state.codcliente)
                .then(response => {
                    dataEvents.value = response.data.data ? response.data.data[0].eventos : []
                })
        })

        const createItem = () => {
            emit('create-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codcliente,
                cod_evento: event.value,
                descripcion: description.value,
                detalles: details.value
            })
            event.value = description.value = details.value = ""
            dialog.value = false
        }

        return {
            dialog,
            dataEvents,
            event,
            description,
            details,
            createItem
        }
    }
}
</script>