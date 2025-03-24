<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Grupo de unidades</h1>
            </div>
            <CreateGroupUnitsVue @create-item="onCreateItem" />
        </div>
        <div class="w-full rounded-lg bg-white grid grid-cols-2 gap-3 p-4 shadow-md">
            <div>
                <v-alert color="#3b82f6" theme="dark" icon="mdi-car" density="compact" border>
                    Lista de unidades
                </v-alert>
                <div class="p-3 border-2 border-blue-400 rounded-lg mt-3 min-h-[5rem]">
                    <v-alert color="#bfdbfe" theme="dark" icon="mdi-truck" density="compact" class="my-1"
                        v-for="item in dataUnits" :key="item.placa">
                        {{ item.placa }}
                    </v-alert>
                </div>
            </div>
            <div>
                <v-alert color="#3b82f6" theme="dark" icon="mdi-car-multiple" density="compact" border>
                    Grupos de unidades
                </v-alert>
                <div class="mt-3">
                    <v-expansion-panels multiple>
                        <v-expansion-panel v-for="group in dataGroupUnits" :key="group.codigo">
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
                                    <v-alert color="#bfdbfe" theme="dark" icon="mdi-truck" density="compact"
                                        v-for="unit in group.unidades" :key="unit" class="my-1">
                                        {{ unit }}
                                    </v-alert>
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </div>
        </div>
    </div>
    <EditGroupUnitsVue :itemEdit="editItem" :openModal="editDialog" @cancel-item="editDialog = false" @edit-item="onUpdateItem"/>
</template>
<script>
import { findAllUnitsApi } from '@/api/VehiclesService';
import { findAllGroupsUnitsApi, createGroupsUnitsApi, deleteGroupsUnitsApi, updateGroupsUnitsApi } from '@/api/GroupUnitsService';
import CreateGroupUnitsVue from '@/components/groups/units/CreateGroupUnits.vue';
import EditGroupUnitsVue from '@/components/groups/units/EditGroupUnits.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from "vue";
import store from '@/store';

export default ({
    components: {
        CreateGroupUnitsVue,
        EditGroupUnitsVue
    },
    setup() {
        const dataUnits = ref([]);
        const dataGroupUnits = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            const [responseUnits, responseGroupUnits] = await Promise.all([
                findAllUnitsApi(store.state.codcuenta, store.state.codcliente),
                findAllGroupsUnitsApi(store.state.codcuenta, store.state.codcliente)
            ])
            dataUnits.value = responseUnits.data.data ? responseUnits.data.data[0].unidades : []
            dataGroupUnits.value = responseGroupUnits.data.data ? responseGroupUnits.data.data[0].grupos_unidades : []
        }

        const onCreateItem = (data) => {
            if (data.nombre != "") {
                createGroupsUnitsApi(data)
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
                    cod_cliente: store.state.codcliente,
                    codigo: codigo
                }
                deleteGroupsUnitsApi(data)
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
            updateGroupsUnitsApi(data)
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
            dataUnits,
            dataGroupUnits,
            editGroup,
            deleteGroup,
            onUpdateItem,
            onCreateItem
        }
    }
})
</script>