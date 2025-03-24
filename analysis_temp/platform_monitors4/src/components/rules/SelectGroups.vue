<template>
    <div class="w-full block lg:flex gap-1 items-center">
        <div class="w-full">
            <v-btn density="compact" class="w-full mb-2 text-none" color="blue-lighten-1" variant="tonal">
                DISPONIBLES
            </v-btn>
            <SelectItemsAndMoveVue :listGroups="itemsAvailable" @list-seleccionados="emitSelectedItemsAvailable"/>
        </div>
        <div class="flex justify-center lg:block">
            <div class="my-1">
                <v-btn :icon="isMobile ? 'mdi-arrow-down' : 'mdi-arrow-right'" variant="tonal" size="small" color="indigo"
                    @click.prevent="moveSelectedItemsToAssigned"></v-btn>
                <v-tooltip activator="parent" location="top">Agregar</v-tooltip>
            </div>
            <div class="my-1">
                <v-btn :icon="isMobile ? 'mdi-arrow-up' : 'mdi-arrow-left'" variant="tonal" size="small" color="indigo"
                    @click.prevent="moveSelectedItemsToAvailable"></v-btn>
                <v-tooltip activator="parent" location="top">Quitar</v-tooltip>
            </div>
        </div>
        <div class="w-full">
            <v-btn density="compact" class="w-full mb-2 text-none" color="blue-lighten-1" variant="tonal">
                ASIGNADOS
            </v-btn>
            <SelectItemsAndMoveVue :listGroups="itemsAssigned" @list-seleccionados="emitSelectedItemsAssigned"/>
        </div>
    </div>
</template>
<script>
import { onMounted, ref, watch } from 'vue';
import SelectItemsAndMoveVue from './SelectItemsAndMove.vue';

export default ({
    props: {
        isMobile: Boolean,
        assigned: Array,
        available: Array
    },
    components: {
        SelectItemsAndMoveVue
    },
    emits: ['selected-groups'],
    setup(props, { emit }) {
        const selectedItemsAvailable = ref([]);
        const selectedItemsAssigned = ref([])
        const itemsAssigned = ref([])
        const itemsAvailable = ref([]);

        onMounted(() => {
            itemsAssigned.value = props.assigned
            itemsAvailable.value = props.available
        })

        watch(() => props.assigned, (newVal) => {
            itemsAssigned.value = newVal
            itemsAvailable.value = props.available
        })

        watch(() => props.available, (newVal) => {
            itemsAvailable.value = newVal
            itemsAssigned.value = props.assigned
        })

        const emitSelectedItemsAssigned = (data) => {
            selectedItemsAssigned.value = data
        }

        const emitSelectedItemsAvailable = (data) => {
            selectedItemsAvailable.value = data
        }

        // Asignar grupos de etiqueta
        const moveSelectedItemsToAssigned = () => {
            if (selectedItemsAvailable.value.length != 0) {
                const newItemsAssigned = selectedItemsAvailable.value.map(group => ({ nombre: group }))
                itemsAssigned.value.push(...newItemsAssigned)
                itemsAvailable.value = itemsAvailable.value
                    .filter((group) => {
                        return newItemsAssigned.findIndex((groupassigned) => groupassigned.nombre === group.nombre) === -1
                    })
            }
        }
        // Quitar de la asignacion los grupos de etiqueta
        const moveSelectedItemsToAvailable = () => {
            if (selectedItemsAssigned.value.length != 0) {
                const newItemsAvailable = selectedItemsAssigned.value.map(group => ({ nombre: group }))
                itemsAvailable.value.push(...newItemsAvailable)
                itemsAssigned.value = itemsAssigned.value
                    .filter((group) => {
                        return newItemsAvailable.findIndex((groupavailable) => groupavailable.nombre === group.nombre) === -1
                    })
            }
        }

        watch(() => itemsAssigned.value, (newVal) => {
            emit('selected-groups', {
                itemsAssigned: newVal,
                itemsAvailable: itemsAvailable.value
            })
        })

        watch(() => itemsAvailable.value, (newVal) => {
            emit('selected-groups', {
                itemsAssigned: itemsAssigned.value,
                itemsAvailable: newVal
            })
        })

        return {
            selectedItemsAvailable,
            selectedItemsAssigned,
            itemsAssigned,
            itemsAvailable,
            emitSelectedItemsAssigned,
            emitSelectedItemsAvailable,
            moveSelectedItemsToAssigned,
            moveSelectedItemsToAvailable
        }
    }
})
</script>