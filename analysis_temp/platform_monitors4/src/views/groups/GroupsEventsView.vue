<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Grupo de eventos</h1>
            </div>
            <CreateGroupEventsVue @create-item="onCreateItem" />
        </div>
        <div class="w-full rounded-lg bg-white grid grid-cols-2 gap-3 p-4 shadow-md">
            <div>
                <v-alert color="#3b82f6" theme="dark" icon="mdi-bell-check" density="compact" border>
                    Lista de eventos
                </v-alert>
                <div class="p-3 border-2 border-blue-400 rounded-lg mt-3 min-h-[5rem]">
                    <v-alert color="#bfdbfe" theme="dark" icon="mdi-bell" density="compact" class="my-1"
                        v-for="event in dataEvents" :key="event.cod_evento">
                        {{ event.cod_evento }}
                    </v-alert>
                </div>
            </div>
            <div>
                <v-alert color="#3b82f6" theme="dark" icon="mdi-clipboard-check-multiple-outline" density="compact" border>
                    Grupos de eventos
                </v-alert>
                <div class="mt-3">
                    <v-expansion-panels multiple>
                        <v-expansion-panel v-for="group in dataGroupEvents" :key="group.codigo">
                            <v-expansion-panel-title color="blue-grey-lighten-5">
                                <div class="flex gap-2">
                                    <span @click.stop>
                                        <v-icon color="green" size="small"
                                            @click="editGroup(group)">mdi-square-edit-outline</v-icon>
                                        <v-tooltip activator="parent" location="top">Editar</v-tooltip>
                                    </span>
                                    <span @click.stop>
                                        <v-icon color="red" size="small"
                                            @click="deleteGroup(group.codigo)">mdi-delete-empty</v-icon>
                                        <v-tooltip activator="parent" location="top">Eliminar</v-tooltip>
                                    </span>
                                    <span>{{ group.nombre }}</span>
                                </div>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="p-3 rounded-lg border min-h-[4rem]">
                                    <v-alert color="#bfdbfe" theme="dark" icon="mdi-bell" density="compact" class="my-1"
                                        v-for="event in group.tiposeventos" :key="event">
                                        {{ event }}
                                    </v-alert>
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </div>
        </div>
    </div>
    <EditGroupEventsVue :itemEdit="editItem" :openModal="editDialog" @cancel-item="editDialog = false" @edit-item="onUpdateItem"/>
</template>
<script>
import { findAllEventsApi } from '@/api/EventsService';
import { findAllGroupsEventsApi, createGroupsEventsApi, deleteGroupsEventsApi, updateGroupsEventsApi } from '@/api/GroupEventsService';
import CreateGroupEventsVue from '@/components/groups/events/CreateGroupEvents.vue';
import EditGroupEventsVue from '@/components/groups/events/EditGroupEvents.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from "vue";
import store from '@/store';

export default ({
    components: {
        CreateGroupEventsVue,
        EditGroupEventsVue
    },
    setup() {
        const dataEvents = ref([]);
        const dataGroupEvents = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            const [responseEvents, responseGroupEvents] = await Promise.all([
                findAllEventsApi(store.state.codcuenta, store.state.codclienteAdmin),
                findAllGroupsEventsApi(store.state.codcuenta, store.state.codclienteAdmin)
            ])
            dataEvents.value = responseEvents.data.data ? responseEvents.data.data[0].eventos : []
            dataGroupEvents.value = responseGroupEvents.data.data ? responseGroupEvents.data.data[0].grupos_tiposdeventos : []
        }

        const onCreateItem = (data) => {
            if (data.nombre != "") {
                createGroupsEventsApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha creado el grupo correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro crear el grupo')
                    })
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Ingrese un nombre')
            }
        }

        const deleteGroup = (codigo) => {
            confirmBasic(async () => {
                const data = {
                    cod_cuenta: store.state.codcuenta,
                    cod_cliente: store.state.codclienteAdmin,
                    codigo: codigo
                }
                deleteGroupsEventsApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha eliminado el grupo correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro eliminar el grupo')
                    })
            }, '¿Estás seguro de eliminar este grupo?', 'Aceptar');
        }

        const editGroup = (group) => {
            editDialog.value = true
            editItem.value = group
        }

        const onUpdateItem = (data) => {
            updateGroupsEventsApi(data)
                .then(() => {
                    basicAlert(async () => {
                        await loadData();
                    }, 'success', 'Logrado', 'Se ha editado el grupo correctamente')
                })
                .catch(() => {
                    basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro editar el grupo')
                })
        }

        return {
            editItem,
            editDialog,
            dataEvents,
            dataGroupEvents,
            onCreateItem,
            deleteGroup,
            editGroup,
            onUpdateItem
        }
    }
})
</script>