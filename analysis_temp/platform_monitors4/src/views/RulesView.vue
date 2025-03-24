<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Reglas</h1>
            </div>
            <CreateRulesVue @create-item="onCreateItem" :dataGroupUnitsProps="dataGroupUnits"
                :dataGroupUsersProps="dataGroupUsers" :dataGroupEventsProps="dataGroupEvents" />
        </div>
        <TableRulesVue :desserts="listRulesData" :dataGroupUnitsProps="dataGroupUnits" :dataGroupUsersProps="dataGroupUsers"
            :dataGroupEventsProps="dataGroupEvents" @delete-item="onDeleteItem" @edit-item="onEditItem" />
    </div>
    <EditRulesVue :openModal="editDialog" :itemEdit="editItem" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
import { findAllRulesApi, createRulesApi, updateRulesApi, deleteRulesApi } from '@/api/RulesService';
import { findAllGroupsUsersApi } from '@/api/GroupUsersService';
import { findAllGroupsEventsApi } from '@/api/GroupEventsService';
import { findAllGroupsUnitsApi } from '@/api/GroupUnitsService';
import CreateRulesVue from '@/components/rules/CreateRules.vue';
import EditRulesVue from '@/components/rules/EditRules.vue';
import TableRulesVue from '@/components/rules/TableRules.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from "vue";
import store from '@/store';


export default ({
    components: {
        CreateRulesVue,
        EditRulesVue,
        TableRulesVue
    },
    setup() {
        const dataGroupUnits = ref([]);
        const dataGroupUsers = ref([]);
        const dataGroupEvents = ref([]);
        const listRulesData = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            const [responseRules, responseGroupUsers, reponseGroupEvents, responseGroupUnits] = await Promise.all([
                findAllRulesApi(store.state.codcuenta, store.state.codclienteAdmin),
                findAllGroupsUsersApi(store.state.codcuenta, store.state.codclienteAdmin),
                findAllGroupsEventsApi(store.state.codcuenta, store.state.codclienteAdmin),
                findAllGroupsUnitsApi(store.state.codcuenta, store.state.codclienteAdmin)
            ])
            listRulesData.value = responseRules.data.data ? responseRules.data.data[0].reglas : []
            dataGroupUnits.value = responseGroupUnits.data.data ? responseGroupUnits.data.data[0].grupos_unidades : []
            dataGroupUsers.value = responseGroupUsers.data.data ? responseGroupUsers.data.data[0].grupos_usuarios : []
            dataGroupEvents.value = reponseGroupEvents.data.data ? reponseGroupEvents.data.data[0].grupos_tiposdeventos : []
        }

        const mapGroupToCode = (groupList, groupNames) => {
            return groupNames.map(groupName => {
                const group = groupList.value.find(group => group.nombre === groupName);
                return group ? group.codigo : null;
            }).filter(code => code !== null);
        };

        const mapCodeToGroup = (groupList, groupCodes) => {
            return groupCodes.map(groupCode => {
                const group = groupList.value.find(group => group.codigo === groupCode);
                return group ? { nombre: group.nombre } : null;
            }).filter(name => name !== null);
        };

        const onCreateItem = (data) => {
            const { regla, cod_grupotiposdeventos, cod_grupounidades, cod_grupousuarios } = data;

            if (regla !== "" && cod_grupotiposdeventos.length > 0 && cod_grupounidades.length > 0 && cod_grupousuarios.length > 0) {
                const codigos_grupotiposdeventos = mapGroupToCode(dataGroupEvents, cod_grupotiposdeventos);
                const codigos_grupounidades = mapGroupToCode(dataGroupUnits, cod_grupounidades);
                const codigos_grupousuarios = mapGroupToCode(dataGroupUsers, cod_grupousuarios);

                const newData = {
                    ...data,
                    cod_grupotiposdeventos: codigos_grupotiposdeventos,
                    cod_grupounidades: codigos_grupounidades,
                    cod_grupousuarios: codigos_grupousuarios
                };
                createRulesApi(newData)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha creado la regla correctamente')
                    })
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Rellene todos los campos, se debe asignar al menos un grupo por cada tipo')
            }
        }

        const onDeleteItem = (item) => {
            const data = {
                "codigo": item.item.codigo,
                "cod_grupousuarios": item.item.cod_grupousuarios,
                "cod_cuenta": store.state.codcuenta,
                "cod_cliente": store.state.codclienteAdmin
            }
            confirmBasic(async () => {
                await deleteRulesApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha eliminado la regla correctamente')
                    })
                    .catch(error => {
                        console.log(error)
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro eliminar')
                    })
            }, '¿Estás seguro de eliminar esta regla?', 'Aceptar');
        }

        const filterItems = (list, toRemove) => {
            return list.filter(item => !toRemove.some(removeItem => removeItem.nombre === item.nombre));
        };

        const onEditItem = (data) => {
            const groupEvents = dataGroupEvents.value.map(group => ({ nombre: group.nombre }))
            const groupUnits = dataGroupUnits.value.map(group => ({ nombre: group.nombre }))
            const groupUsers = dataGroupUsers.value.map(group => ({ nombre: group.nombre }))
            const editAssignedGroupEvents = mapCodeToGroup(dataGroupEvents, data.item.cod_grupotiposdeventos);
            const editAssignedGroupUnits = mapCodeToGroup(dataGroupUnits, data.item.cod_grupounidades);
            const editAssignedGroupUsers = mapCodeToGroup(dataGroupUsers, data.item.cod_grupousuarios);
            const editAvailableGroupEvents = filterItems(groupEvents, editAssignedGroupEvents);
            const editAvailableGroupUnits = filterItems(groupUnits, editAssignedGroupUnits);
            const editAvailableGroupUsers = filterItems(groupUsers, editAssignedGroupUsers);
            editItem.value = { ...data, editAssignedGroupEvents, editAssignedGroupUnits, editAssignedGroupUsers, editAvailableGroupEvents, editAvailableGroupUnits, editAvailableGroupUsers }
            editDialog.value = true
        }

        const onUpdateItem = (data) => {
            const { regla, cod_grupotiposdeventos, cod_grupounidades, cod_grupousuarios } = data;

            if (regla !== "" && cod_grupotiposdeventos.length > 0 && cod_grupounidades.length > 0 && cod_grupousuarios.length > 0) {
                const codigos_grupotiposdeventos = mapGroupToCode(dataGroupEvents, cod_grupotiposdeventos);
                const codigos_grupounidades = mapGroupToCode(dataGroupUnits, cod_grupounidades);
                const codigos_grupousuarios = mapGroupToCode(dataGroupUsers, cod_grupousuarios);

                const newData = {
                    ...data,
                    cod_grupotiposdeventos: codigos_grupotiposdeventos,
                    cod_grupounidades: codigos_grupounidades,
                    cod_grupousuarios: codigos_grupousuarios
                };
                updateRulesApi(newData)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha editado la regla correctamente')
                    })
                    .catch(error => {
                        console.log(error)
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro editar la regla')
                    })
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Rellene todos los campos, se debe asignar al menos un grupo por cada tipo')
            }
        }

        return {
            dataGroupUnits,
            dataGroupUsers,
            dataGroupEvents,
            listRulesData,
            editDialog,
            editItem,
            onUpdateItem,
            onDeleteItem,
            onCreateItem,
            onEditItem
        }
    }
})
</script>