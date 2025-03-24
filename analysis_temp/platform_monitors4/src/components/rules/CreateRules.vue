<template>
    <v-btn size="small" color="blue" @click="dialog = true"><v-icon icon="mdi-plus"></v-icon>
        Crear Nuevo</v-btn>
    <v-dialog v-model="dialog" width="680" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Crear regla</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Nombre" prepend-inner-icon="mdi-form-textbox" color="indigo"
                        v-model="name" hide-details></v-text-field>
                    <div class="w-full bg-blue-400 text-white rounded-sm py-1 px-3 my-2 text-center text-sm">Grupos de usuarios
                    </div>
                    <SelectGroups :assigned="assignedUsers" :available="dataGroupUsers" :isMobile="isMobile"
                        @selected-groups="selectedUsersGroup" />

                    <div class="w-full bg-blue-400 text-white rounded-sm py-1 px-3 my-2 text-center text-sm">Grupos de unidades
                    </div>
                    <SelectGroups :assigned="assignedUnits" :available="dataGroupUnits" :isMobile="isMobile"
                        @selected-groups="selectedUnitsGroup" />

                    <div class="w-full bg-blue-400 text-white rounded-sm py-1 px-3 my-2 text-center text-sm">Grupos de eventos
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
                <v-btn color="blue-lighten-1" variant="tonal" @click="createItem">
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
        dataGroupUnitsProps: Array,
        dataGroupUsersProps: Array,
        dataGroupEventsProps: Array
    },
    components: {
        SelectGroups
    },
    emits: ['create-item'],
    setup(props, { emit }) {
        const dialog = ref(false);
        const name = ref('');
        const isMobile = ref(false);
        const dataGroupUnits = ref([]);
        const dataGroupUsers = ref([]);
        const dataGroupEvents = ref([]);
        const selectedGroupUnits = ref([]);
        const selectedGroupUsers = ref([]);
        const selectedGroupEvents = ref([]);
        const assignedUsers = ref([]);
        const assignedUnits = ref([]);
        const assignedEvents = ref([]);

        watch(() => dialog.value, (newVal) => {
            if (newVal == true) {
                handleResize();
                window.addEventListener("resize", handleResize);
            }
        })

        watch(() => props.dataGroupUnitsProps, (newVal) => {
            dataGroupUnits.value = newVal.map(groupUnit => ({ nombre: groupUnit.nombre }))
        })

        watch(() => props.dataGroupUsersProps, (newVal) => {
            dataGroupUsers.value = newVal.map(groupUser => ({ nombre: groupUser.nombre }))
        })

        watch(() => props.dataGroupEventsProps, (newVal) => {
            dataGroupEvents.value = newVal.map(groupEvent => ({ nombre: groupEvent.nombre }))
        })

        const handleResize = () => {
            isMobile.value = window.innerWidth <= 500; // Define aquí el ancho máximo para considerar como pantalla pequeña
        };

        const createItem = () => {
            emit('create-item', {
                cod_cuenta: store.state.codcuenta,
                cod_cliente: store.state.codclienteAdmin,
                empresa: store.state.empresa,
                regla: name.value,
                cod_grupotiposdeventos: selectedGroupEvents.value,
                cod_grupounidades: selectedGroupUnits.value,
                cod_grupousuarios: selectedGroupUsers.value
            })
            cancelItem()
        }

        const cancelItem = () => {
            name.value = ""
            assignedUsers.value = []
            assignedUnits.value = []
            assignedEvents.value = []
            dialog.value = false
        }

        const selectedUsersGroup = (data) => {
            selectedGroupUsers.value = data.itemsAssigned.map(item => item.nombre)
        }

        const selectedUnitsGroup = (data) => {
            selectedGroupUnits.value = data.itemsAssigned.map(item => item.nombre)
        }

        const selectedEventsGroup = (data) => {
            selectedGroupEvents.value = data.itemsAssigned.map(item => item.nombre)
        }

        return {
            assignedEvents,
            assignedUnits,
            assignedUsers,
            dataGroupUnits,
            dataGroupUsers,
            dataGroupEvents,
            dialog,
            name,
            isMobile,
            createItem,
            cancelItem,
            selectedUsersGroup,
            selectedUnitsGroup,
            selectedEventsGroup
        }
    }
})
</script>