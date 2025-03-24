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
                { title: 'Empresa', align: 'start', key: 'empresa' },
                { title: 'Placa', align: 'start', key: 'placa' },
                { title: 'Fecha creación', align: 'start', key: 'fecha_creacion' },
                { title: 'Estado', align: 'start', key: 'status' },
                { title: 'Acción', align: 'center', key: 'actions' },
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

        return {
            editItem,
            deleteItem
        }
    }
})
</script>