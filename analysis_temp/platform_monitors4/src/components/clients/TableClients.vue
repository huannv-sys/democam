<template>
    <v-data-table :headers="headers" :items="desserts" class="elevation-1 text-sm rounded-lg">
        <template v-slot:[`item.estado`]="{ item }">
            <v-chip :color="item.estado ? 'green' : 'red'">
                {{ item.estado ? 'Activo' : 'Desactivado' }}
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
        desserts: Array,
    },
    components: {
        VDataTable,
    },
    emits: ['delete-item', 'edit-item'],
    data() {
        return {
            headers: [
                { title: 'Usuario', align: 'start', key: 'usuario' },
                { title: 'Empresa', align: 'start', key: 'empresa' },
                { title: 'Sigla', align: 'start', key: 'sigla' },
                { title: 'Ruc', align: 'center', key: 'ruc' },
                { title: 'Estado', align: 'center', key: 'estado' },
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

        return {
            editItem,
            deleteItem,
        }
    }
})
</script>