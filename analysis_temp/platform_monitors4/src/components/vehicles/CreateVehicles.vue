<template>
    <v-btn size="small" color="blue" @click="dialog = true"><v-icon icon="mdi-plus"></v-icon>
        Crear Nuevo</v-btn>
    <v-dialog v-model="dialog" width="500">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Crear vehículo</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Placa" prepend-inner-icon="mdi-card-bulleted" color="indigo"
                        v-model="plate"></v-text-field>
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
        const plate = ref('');

        const createItem = () => {
            const fecha = new Date();
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); // Sumamos 1 porque los meses van de 0 a 11
            const anio = fecha.getFullYear();

            const fechaFormateada = `${dia}-${mes}-${anio}`;
            emit('create-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codcliente,
                cod_unidad: '',
                fecha_creacion: fechaFormateada,
                placa: plate.value,
                status: true
            })
            plate.value = ""
            dialog.value = false
        }
        return {
            dialog,
            plate,
            createItem
        }
    }
}
</script>