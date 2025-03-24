<template>
    <v-dialog v-model="dialog" width="680" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Editar regla</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Nombre" prepend-inner-icon="mdi-form-textbox" color="indigo"
                        v-model="name" hide-details></v-text-field>
                    <div class="w-full bg-blue-400 text-white rounded-sm py-1 px-3 my-2 text-center text-sm">Grupos de
                        unidades
                    </div>
                    <SelectGroups :assigned="assignedUnits" :available="dataGroupUnits" :isMobile="isMobile"
                        @selected-groups="selectedUnitsGroup" />

                    <div class="w-full bg-blue-400 text-white rounded-sm py-1 px-3 my-2 text-center text-sm">Grupos de
                        eventos
                    </div>
                    <SelectGroups :assigned="assignedEvents" :available="dataGroupEvents" :isMobile="isMobile"
                        @selected-groups="selectedEventsGroup" />
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
import SelectGroups from './SelectGroups.vue';

export default ({
    props: {
        itemEdit: Object,
        openModal: Boolean
    },
    components: {
        SelectGroups
    },
    emits: ['edit-item', 'cancel-item'],
    setup(props, { emit }) {
        const dialog = ref(false);
        const name = ref('');
        const isMobile = ref(false);
        const dataGroupUnits = ref([]);
        const dataGroupEvents = ref([]);
        const selectedGroupUnits = ref([]);
        const selectedGroupEvents = ref([]);
        const assignedUnits = ref([]);
        const assignedEvents = ref([]);

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
            if (newVal == true) {
                handleResize();
                window.addEventListener("resize", handleResize);
            }
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                name.value = newVal.item.regla
                dataGroupUnits.value = newVal.editAvailableGroupUnits
                dataGroupEvents.value = newVal.editAvailableGroupEvents
                assignedUnits.value = newVal.editAssignedGroupUnits
                assignedEvents.value = newVal.editAssignedGroupEvents
            }
        })


        const handleResize = () => {
            isMobile.value = window.innerWidth <= 500;
        };

        const editItem = () => {
            emit('edit-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codclienteAdmin,
                regla: name.value,
                codigo: props.itemEdit.item.codigo,
                cod_grupotiposdeventos: selectedGroupEvents.value,
                cod_grupounidades: selectedGroupUnits.value,
                cod_grupousuarios: props.itemEdit.item.cod_grupousuarios,
            })
            cancelItem()
        }

        const cancelItem = () => {
            name.value = ""
            assignedUnits.value = assignedEvents.value = []
            emit('cancel-item')
        }

        const selectedUnitsGroup = (data) => {
            selectedGroupUnits.value = data.itemsAssigned.map(item => item.nombre)
        }

        const selectedEventsGroup = (data) => {
            selectedGroupEvents.value = data.itemsAssigned.map(item => item.nombre)
        }

        return {
            dialog,
            name,
            isMobile,
            assignedEvents,
            assignedUnits,
            dataGroupUnits,
            dataGroupEvents,
            editItem,
            cancelItem,
            selectedUnitsGroup,
            selectedEventsGroup
        }
    }
})
</script>