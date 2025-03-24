<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Administrar cuentas</h1>
            </div>
            <CreateAccountsVue @create-item="onCreateItem" />
        </div>
        <TableAccountsVue :desserts="dataUsers" @delete-item="onDeleteItem" @edit-item="onEditItem" />
    </div>
    <EditAccountsVue :openModal="editDialog" :itemEdit="editItem" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
/* eslint-disable */
import { findAllClientsToAccountApi } from '@/api/UsersService';
import { deleteAccountsApi, editAccountsApi, createAccountsApi } from '@/api/AccountsService';
import { onMounted, ref } from 'vue';
import store from '@/store';
import TableAccountsVue from '@/components/accounts/TableAccounts.vue';
import CreateAccountsVue from '@/components/accounts/CreateAccounts.vue';
import EditAccountsVue from '@/components/accounts/EditAccounts.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import md5 from 'md5';

export default ({
    components: {
        TableAccountsVue,
        EditAccountsVue,
        CreateAccountsVue
    },
    setup() {
        const dataUsers = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData()
        })

        const loadData = async () => {
            const responseAccounts = await findAllClientsToAccountApi(store.state.codcuenta)
            const accounts = responseAccounts.data.data ? responseAccounts.data.data : []
            console.log(accounts)
            dataUsers.value = accounts.filter(account => account.usuario != "root")
        }

        const onCreateItem = (data) => {
            if (data.initials != "" && data.username != "" && data.password != "" && data.businessName != "" && data.businessCode != "") {
                const newData = {
                    "cod_cuenta": "",
                    "cod_cliente": "All",
                    "contrasena": md5(data.password),
                    "usuario": data.username ,
                    "ruc": data.businessCode,
                    "rol": "Administrador",
                    "empresa": data.businessName,
                    "sigla": data.initials,
                    "estado": true,
                    "clientes": []
                }
                createAccountsApi(newData)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha creado el cliente correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro crear el cliente')
                    })
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Rellene todos los campos')
            }
        }

        const onDeleteItem = (data) => {
            const newData = {
                "cod_cuenta": store.state.codcuenta,
                "cod_cliente": data.item.cod_cliente,
                "usuario": data.item.usuario
            }
            confirmBasic(async () => {
                deleteAccountsApi(newData)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha eliminado el cliente correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro eliminar el cliente')
                    })
            }, '¿Estás seguro de eliminar este cliente?', 'Aceptar');
        }

        const onEditItem = (data) => {
            editItem.value = data
            editDialog.value = true
        }

        const onUpdateItem = (data) => {
            const newData = {
                "id": editItem.value.item.ID,
                "cod_cuenta":  editItem.value.item.cod_cuenta,
                "contrasena": editItem.value.item.contrasena == data.password ? data.password : md5(data.password),
                "usuario": data.username,
                "ruc": data.businessCode,
                "rol": "Administrador",
                "empresa": data.businessName,
                "sigla": data.initials,
                "estado": data.state,
                "nombre_completo": editItem.value.item.nombre_completo,
                "nombre_contacto1": editItem.value.item.nombre_contacto1,
                "telefono_contacto1": editItem.value.item.telefono_contacto1,
                "nombre_contacto2": editItem.value.item.nombre_contacto2,
                "telefono_contacto2": editItem.value.item.telefono_contacto2,
            }
            editAccountsApi(newData)
                .then(() => {
                    basicAlert(async () => {
                        await loadData();
                    }, 'success', 'Logrado', 'Se ha editado el cliente correctamente')
                })
                .catch(() => {
                    basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro editar el cliente')
                })
        }

        return {
            dataUsers,
            editDialog,
            editItem,
            onEditItem,
            onCreateItem,
            onDeleteItem,
            onUpdateItem
        }
    }
})
</script>