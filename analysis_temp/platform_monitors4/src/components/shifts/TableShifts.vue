<template>
    <v-data-table :headers="headers" :items="desserts" class="elevation-1 text-sm rounded-lg">
        <template v-slot:[`item.actions`]="{ item }">
            <div class="flex gap-1 justify-center">
                <span @click="editItem(item)">
                    <v-btn icon="mdi-pencil" size="small" variant="text" color="green"></v-btn>
                    <v-tooltip activator="parent" location="top">Editar</v-tooltip>
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
                { title: 'Código', align: 'start', key: 'cod_turno' },
                { title: 'Descripción', align: 'start', key: 'descripcion' },
                { title: 'Desde', align: 'start', key: 'desde' },
                { title: 'Hasta', align: 'start', key: 'hasta' },
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