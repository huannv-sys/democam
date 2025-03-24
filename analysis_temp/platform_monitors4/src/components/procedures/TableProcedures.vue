<template>
    <v-data-table :headers="headers" :items="desserts" class="elevation-1 text-sm rounded-lg">
        <template v-slot:[`item.detalles`]="{ item }">
            {{
                truncateText(item.detalles)
            }}
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
                { title: 'Código evento', align: 'start', key: 'cod_evento' },
                { title: 'Nombre', align: 'start', key: 'descripcion' },
                { title: 'Detalles', align: 'start', key: 'detalles' },
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

        const truncateText = (text) => {
            if (text && text.length > 60) {
                return text.slice(0, 60) + '...';
            }
            return text;
        };

        return {
            editItem,
            deleteItem,
            truncateText
        }
    }
})
</script>