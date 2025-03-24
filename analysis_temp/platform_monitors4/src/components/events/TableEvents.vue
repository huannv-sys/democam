<template>
    <v-data-table :headers="headers" :items="desserts" class="elevation-1 text-sm rounded-lg">
        <template v-slot:[`item.status`]="{ item }">
            <v-chip :color="item.status ? 'green' : 'red'">
                {{ item.status ? 'Activo' : 'Desactivado' }}
            </v-chip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
            <div class="flex gap-1 justify-center">
                <span @click="editItem(item)">
                    <v-btn icon="mdi-pencil" size="small" variant="text" color="green"></v-btn>
                    <v-tooltip activator="parent" location="top">Editar</v-tooltip>
                </span>
                <span @click="payloadItem(item)">
                    <v-btn icon="mdi-code-array" size="small" variant="text" color="indigo"></v-btn>
                    <v-tooltip activator="parent" location="top">Payload</v-tooltip>
                </span>
                <span @click="deleteItem(item)">
                    <v-btn icon="mdi-delete-empty" size="small" variant="text" color="red"></v-btn>
                    <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
                </span>
            </div>
        </template>
    </v-data-table>
</template>
<script>
import { VDataTable } from 'vuetify/labs/VDataTable';
import Swal from 'sweetalert2';
import store from '@/store';

export default ({
    props: {
        desserts: Array
    },
    components: {
        VDataTable,
    },
    emits: ['delete-item', 'edit-item'],
    data() {
        return {
            headers: [
                { title: 'Código', align: 'start', key: 'cod_evento' },
                { title: 'Descripción', align: 'start', key: 'descripcion' },
                { title: 'Prioridad', align: 'start', key: 'prioridad' },
                { title: 'Fecha creación', align: 'start', key: 'fecha_creacion' },
                { title: 'Estado', align: 'center', key: 'status' },
                { title: 'Acciones', key: 'actions', align: 'center' },
            ]
        }
    },
    setup(_, { emit }) {
        const editItem = (item) => {
            emit('edit-item', { item })
        }

        const deleteItem = (item) => {
            emit('delete-item', { item })
        }

        const payloadItem = (item) => {
            console.log(item)
            const codeToCopy = JSON.stringify({
                "cod_cuenta": store.state.codcuenta,
                "cod_cliente": store.state.codcliente,
                "cod_evento": item.cod_evento,
                "sigla_cuenta": item.sigla_cuenta,
                
                "sigla_cliente": item.sigla_cliente,
                "prioridad": item.prioridad,
                "placa": "%UNIT%",
                "origen": "Sys4Log",
                "latitud": "%LATD%",
                "fecha": "%POS_TIME%",
                "fecha_actual": "%CURR_TIME%",
                "longitud": "%LOND%",
                "velocidad": "%SPEED%",
                "geocerca": "%ZONE_MIN%",
                "grupo": "Z3",
                "direccion": "%LOCATION%"
            }, null, 2)
            Swal.fire({
                html: `
                    <h1 class="text-xl font-bold text-center w-full">Payload de evento</h1>
                    <div class="code-json mt-3">
                        <pre><code class="language-json">${codeToCopy}</code></pre>
                    </div>
                    `,
                confirmButtonText: 'Cerrar'
            })
        }

        // function copyToClipboard(text) {
        //     navigator.clipboard.writeText(text)
        //         .then(() => {
        //             Swal.fire({
        //                 icon: 'success',
        //                 title: 'Copiado al portapapeles!',
        //                 showConfirmButton: false,
        //                 timer: 1500
        //             });
        //         })
        //         .catch((err) => {
        //             console.error('Error al copiar al portapapeles: ', err);
        //             Swal.fire({
        //                 icon: 'error',
        //                 title: 'Error al copiar',
        //                 text: err.message || 'Hubo un problema al copiar al portapapeles.'
        //             });
        //         });
        // }

        return {
            editItem,
            deleteItem,
            payloadItem
        }
    }
})
</script>
