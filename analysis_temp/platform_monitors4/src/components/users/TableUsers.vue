<template>
    <v-data-table :headers="headers" :items="desserts" class="elevation-1 text-sm rounded-lg">
        <template v-slot:[`item.codigo_turno`]="{ item }">
            {{ findDescriptionShift(item.codigo_turno) }}
        </template>
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
import { watch, ref } from 'vue';
import { VDataTable } from 'vuetify/labs/VDataTable';

export default ({
    props: {
        desserts: Array,
        shiftsDataProps: Array
    },
    components: {
        VDataTable,
    },
    emits: ['delete-item', 'edit-item'],
    data() {
        return {
            headers: [
                { title: 'Usuario', align: 'start', key: 'usuario' },
                { title: 'Nombre', align: 'start', key: 'nombre_completo' },
                { title: 'Turno', align: 'start', key: 'codigo_turno' },
                { title: 'Rol', align: 'start', key: 'rol' },
                { title: 'Estado', align: 'center', key: 'estado' },
                { title: 'Acciones', key: 'actions', align: 'center' },
            ]
        }
    },
    setup(props, { emit }) {
        const dataShifts = ref([]);

        watch(() => props.shiftsDataProps, (newVal) => {
            dataShifts.value = newVal
        })

        const editItem = (item) => {
            emit('edit-item', { item })
        }

        const deleteItem = (item) => {
            emit('delete-item', { item })
        }

        const findDescriptionShift = (cod_shift) => {
            if(cod_shift.length > 0){
                const description = dataShifts.value.find(shift => shift.cod_turno == cod_shift).descripcion
                return description
            }else{
                return 'Completo'
            }
        }

        return {
            editItem,
            deleteItem,
            findDescriptionShift
        }
    }
})
</script>