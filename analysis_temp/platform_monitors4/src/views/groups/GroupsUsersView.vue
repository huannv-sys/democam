<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Grupo de usuarios</h1>
            </div>
            <CreateGroupVue @create-item="onCreateItem" />
        </div>
        <div class="w-full rounded-lg bg-white grid grid-cols-2 gap-3 p-4 shadow-md">
            <div>
                <v-alert color="#3b82f6" theme="dark" icon="mdi-account-details" density="compact" border>
                    Lista de usuarios
                </v-alert>
                <div class="p-3 border-2 border-blue-400 rounded-lg mt-3 min-h-[5rem]">
                    <v-alert color="#bfdbfe" theme="dark" icon="mdi-account" density="compact" class="my-1"
                        v-for="user in dataUsers" :key="user.usuario">
                        {{ user.usuario }}
                    </v-alert>
                </div>
            </div>
            <div>
                <v-alert color="#3b82f6" theme="dark" icon="mdi-account-group" density="compact" border>
                    Grupos de usuarios
                </v-alert>
                <div class="mt-3">
                    <v-expansion-panels multiple>
                        <v-expansion-panel v-for="group in dataGroupUsers" :key="group.codigo">
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
                                    <v-alert color="#bfdbfe" theme="dark" icon="mdi-account" density="compact"
                                        v-for="user in group.usuarios" :key="user" class="my-1">
                                        {{ user }}
                                    </v-alert>
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </div>
        </div>
    </div>
    <EditGroupUsersVue :itemEdit="editItem" :openModal="editDialog" @cancel-item="editDialog = false" @edit-item="onUpdateItem"/>
</template>
<script>
import { findAllClientsApi } from '@/api/UsersService';
import { findAllGroupsUsersApi, createGroupsUsersApi, deleteGroupsUsersApi, updateGroupsUsersApi } from '@/api/GroupUsersService';
import CreateGroupVue from '@/components/groups/users/CreateGroupUsers.vue';
import EditGroupUsersVue from '@/components/groups/users/EditGroupUsers.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from "vue";
import store from '@/store';

export default ({
    components: {
        CreateGroupVue,
        EditGroupUsersVue
    },
    setup() {
        const dataUsers = ref([]);
        const dataGroupUsers = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            const [responseUsers, responseGroupUsers] = await Promise.all([
                findAllClientsApi(store.state.codcuenta, store.state.empresa),
                findAllGroupsUsersApi(store.state.codcuenta, store.state.codcliente)
            ])
            dataUsers.value = responseUsers.data.data.filter(cliente => cliente.empresa == store.state.empresa && cliente.rol != "Administrador")
            dataGroupUsers.value = responseGroupUsers.data.data ? responseGroupUsers.data.data[0].grupos_usuarios : []
        }

        const onCreateItem = (data) => {
            if (data.nombre != "") {
                createGroupsUsersApi(data)
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
                    codigo: codigo,
                    ruc_cuenta: store.state.ruc
                }
                deleteGroupsUsersApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha eliminado el grupo correctamente')
                    })
                    .catch(error => {
                        basicAlert(() => { }, 'error', 'Hubo un error', error.response.data.message)
                    })
            }, '¿Estás seguro de eliminar este grupo?', 'Aceptar');
        }

        const editGroup = (group) => {
            editDialog.value = true
            editItem.value = group
        }

        const onUpdateItem = (data) => {
            updateGroupsUsersApi(data)
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
            dataUsers,
            dataGroupUsers,
            editDialog,
            editItem,
            onCreateItem,
            deleteGroup,
            editGroup,
            onUpdateItem
        }
    }
})
</script>