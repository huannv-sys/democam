<template>
    <v-dialog v-model="dialog" width="600" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Editar grupo de unidades</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Nombre" prepend-inner-icon="mdi-form-textbox" color="indigo"
                        v-model="name"></v-text-field>
                    <div class="w-full block lg:flex gap-1 items-center">
                        <div class="w-full">
                            <v-btn density="compact" class="w-full mb-2 text-none" color="blue-lighten-1" variant="tonal">
                                UNIDADES DISPONIBLES
                            </v-btn>
                            <SelectItemsAndMoveVue :listGroups="itemsAvailable"
                                @list-seleccionados="emitSelectedItemsAvailable" nameGrupo="Obras libres" />
                        </div>
                        <div class="flex justify-center lg:block">
                            <div class="my-1">
                                <v-btn :icon="isMobile ? 'mdi-arrow-down' : 'mdi-arrow-right'" variant="tonal" size="small"
                                    color="indigo" @click.prevent="moveSelectedItemsToAssigned"></v-btn>
                                <v-tooltip activator="parent" location="top">Agregar</v-tooltip>
                            </div>
                            <div class="my-1">
                                <v-btn :icon="isMobile ? 'mdi-arrow-up' : 'mdi-arrow-left'" variant="tonal" size="small"
                                    color="indigo" @click.prevent="moveSelectedItemsToAvailable"></v-btn>
                                <v-tooltip activator="parent" location="top">Quitar</v-tooltip>
                            </div>
                        </div>
                        <div class="w-full">
                            <v-btn density="compact" class="w-full mb-2 text-none" color="blue-lighten-1" variant="tonal">
                                UNIDADES ASIGNADAS
                            </v-btn>
                            <SelectItemsAndMoveVue :listGroups="itemsAssigned"
                                @list-seleccionados="emitSelectedItemsAssigned" nameGrupo="Obras asignadas" />
                        </div>
                    </div>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-grey-lighten-2" variant="tonal" @click="cancelItem">
                    Cancelar
                </v-btn>
                <v-btn color="blue-lighten-1" variant="tonal" @click="editItem">
                    Aceptar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import store from '@/store';
import { ref, watch } from 'vue';
import SelectItemsAndMoveVue from '../SelectItemsAndMove.vue';
import { findAllUnitsApi } from '@/api/VehiclesService';

export default ({
    components: {
        SelectItemsAndMoveVue
    },
    props: {
        itemEdit: Object,
        openModal: Boolean
    },
    emits: ['edit-item', 'cancel-item'],
    setup(props, { emit }) {
        const dataUnits = ref([]);
        const dialog = ref(false);
        const name = ref('');
        const codigo = ref('');
        const selectedItemsAvailable = ref([]);
        const selectedItemsAssigned = ref([])
        const itemsAssigned = ref([])
        const itemsAvailable = ref([]);
        const isMobile = ref(false);

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        watch(() => dialog.value, (newVal) => {
            if (newVal == true) {
                handleResize();
                window.addEventListener("resize", handleResize);
            }
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                codigo.value = newVal.codigo
                name.value = newVal.nombre
                itemsAssigned.value = newVal.unidades.map(unit => ({ name: unit }))
                findAllUnitsApi(store.state.codcuenta, store.state.codcliente)
                    .then(response => {
                        dataUnits.value = response.data.data ? response.data.data[0].unidades : []
                        itemsAvailable.value = dataUnits.value
                            .filter(unit => !newVal.unidades.includes(unit.placa))
                            .map(unit => ({ name: unit.placa }));
                    })
            }
        })

        const handleResize = () => {
            isMobile.value = window.innerWidth <= 500; // Define aquí el ancho máximo para considerar como pantalla pequeña
        };

        const editItem = () => {
            emit('edit-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codcliente,
                codigo: codigo.value,
                nombre: name.value,
                unidades: itemsAssigned.value.map(unit => unit.name)
            })
            cancelItem()
        }

        const cancelItem = () => {
            emit('cancel-item')
        }

        const emitSelectedItemsAssigned = (data) => {
            selectedItemsAssigned.value = data
        }
        const emitSelectedItemsAvailable = (data) => {
            selectedItemsAvailable.value = data
        }
        // Asignar grupos de etiqueta
        const moveSelectedItemsToAssigned = () => {
            if (selectedItemsAvailable.value.length != 0) {
                const newItemsAssigned = selectedItemsAvailable.value.map(group => ({ name: group }))
                itemsAssigned.value.push(...newItemsAssigned)
                itemsAvailable.value = itemsAvailable.value
                    .filter((group) => {
                        return newItemsAssigned.findIndex((groupassigned) => groupassigned.name === group.name) === -1
                    })
            }
        }
        // Quitar de la asignacion los grupos de etiqueta
        const moveSelectedItemsToAvailable = () => {
            if (selectedItemsAssigned.value.length != 0) {
                const newItemsAvailable = selectedItemsAssigned.value.map(group => ({ name: group }))
                itemsAvailable.value.push(...newItemsAvailable)
                itemsAssigned.value = itemsAssigned.value
                    .filter((group) => {
                        return newItemsAvailable.findIndex((groupavailable) => groupavailable.name === group.name) === -1
                    })
            }
        }

        return {
            dialog,
            name,
            isMobile,
            editItem,
            cancelItem,
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