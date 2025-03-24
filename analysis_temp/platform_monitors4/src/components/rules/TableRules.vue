<template>
    <v-data-table :headers="headers" :items="desserts" class="elevation-1 text-sm rounded-lg">
        <template v-slot:[`item.cod_grupousuarios`]="{ item }">
            <div class="flex gap-1 justify-center p-1">
                <span @click="viewGroupUsers(item.cod_grupousuarios, 'Grupos de usuarios')">
                    <v-btn icon="mdi-account-multiple-outline" variant="tonal" color="indigo"></v-btn>
                    <v-tooltip activator="parent" location="top">Ver</v-tooltip>
                </span>
            </div>
        </template>
        <template v-slot:[`item.cod_grupounidades`]="{ item }">
            <div class="flex gap-1 justify-center p-1">
                <span @click="viewGroupUnits(item.cod_grupounidades, 'Grupos de unidades')">
                    <v-btn icon="mdi-car-multiple" variant="tonal" color="indigo"></v-btn>
                    <v-tooltip activator="parent" location="top">Ver</v-tooltip>
                </span>
            </div>
        </template>
        <template v-slot:[`item.cod_grupotiposdeventos`]="{ item }">
            <div class="flex gap-1 justify-center p-1">
                <span @click="viewGroupTypeEvents(item.cod_grupotiposdeventos, 'Grupos de eventos')">
                    <v-btn icon="mdi-clipboard-text-multiple-outline" variant="tonal" color="indigo"></v-btn>
                    <v-tooltip activator="parent" location="top">Ver</v-tooltip>
                </span>
            </div>
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
    <ViewGroupsVue :nameGrupo="titleView" :openModal="viewDialog" :itemsView="listGroupsView"
        @cancel-item="viewDialog = false" />
</template>
<script>
import { ref, onMounted, watch } from 'vue';
import { VDataTable } from 'vuetify/labs/VDataTable';
import ViewGroupsVue from './ViewGroups.vue'

export default ({
    props: {
        desserts: Array,
        dataGroupUnitsProps: Array,
        dataGroupUsersProps: Array,
        dataGroupEventsProps: Array
    },
    components: {
        VDataTable,
        ViewGroupsVue,
    },
    emits: ['delete-item', 'edit-item'],
    data() {
        return {
            headers: [
                { title: 'Regla', align: 'start', key: 'regla' },
                { title: 'Grupo usuarios', align: 'center', key: 'cod_grupousuarios' },
                { title: 'Grupo unidades', align: 'center', key: 'cod_grupounidades' },
                { title: 'Grupo eventos', align: 'center', key: 'cod_grupotiposdeventos' },
                { title: 'Acción', align: 'center', key: 'actions' },
            ]
        }
    },
    setup(props, { emit }) {
        const dataGroupUnits = ref([]);
        const dataGroupUsers = ref([]);
        const dataGroupEvents = ref([]);
        const viewDialog = ref(false);
        const listGroupsView = ref([]);
        const titleView = ref('');

        onMounted(async () => {
            dataGroupUnits.value = props.dataGroupUnitsProps
            dataGroupUsers.value = props.dataGroupUsersProps
            dataGroupEvents.value = props.dataGroupEventsProps
        })

        watch(() => props.dataGroupUnitsProps, (newVal) => {
            dataGroupUnits.value = newVal
        })

        watch(() => props.dataGroupUsersProps, (newVal) => {
            dataGroupUsers.value = newVal
        })

        watch(() => props.dataGroupEventsProps, (newVal) => {
            dataGroupEvents.value = newVal
        })

        const editItem = (item) => {
            emit('edit-item', { item })
        }

        const deleteItem = (item) => {
            emit('delete-item', { item })
        }

        const viewGroupUsers = (cod_groupList, title) => {
            const lista = cod_groupList.map(group => {
                const groupUser = dataGroupUsers.value.find(groupUser => groupUser.codigo == group)
                return groupUser
            })
            listGroupsView.value = lista.map(item => {
                const { usuarios, ...resto } = item;
                return { ...resto, items: usuarios };
            });
            titleView.value = title
            viewDialog.value = true
        }

        const viewGroupUnits = (cod_groupList, title) => {
            const lista = cod_groupList.map(group => {
                const groupUnit = dataGroupUnits.value.find(groupUnit => groupUnit.codigo == group)
                return groupUnit
            })
            listGroupsView.value = lista.map(item => {
                const { unidades, ...resto } = item;
                return { ...resto, items: unidades };
            });
            titleView.value = title
            viewDialog.value = true
        }

        const viewGroupTypeEvents = (cod_groupList, title) => {
            const lista = cod_groupList.map(group => {
                const groupEvents = dataGroupEvents.value.find(groupEvents => groupEvents.codigo == group)
                return groupEvents
            })
            listGroupsView.value = lista.map(item => {
                const { tiposeventos, ...resto } = item;
                return { ...resto, items: tiposeventos };
            });
            titleView.value = title
            viewDialog.value = true
        }
        return {
            listGroupsView,
            viewDialog,
            titleView,
            editItem,
            deleteItem,
            viewGroupUsers,
            viewGroupUnits,
            viewGroupTypeEvents
        }
    }
})
</script>