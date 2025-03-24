<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Administrar clientes</h1>
            </div>
            <CreateClientsVue @create-item="onCreateItem" />
        </div>
        <TableClientsVue :desserts="dataUsers" @delete-item="onDeleteItem" @edit-item="onEditItem" />
    </div>
    <EditClientsVue :openModal="editDialog" :itemEdit="editItem" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
import { findAllClientsToAccountApi, deleteClientsApi, createClientsApi, editClientsApi } from '@/api/UsersService';
import { onMounted, ref } from 'vue';
import store from '@/store';
import TableClientsVue from '@/components/clients/TableClients.vue';
import CreateClientsVue from '@/components/clients/CreateClients.vue';
import EditClientsVue from '@/components/clients/EditClients.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import md5 from 'md5';

export default ({
    components: {
        TableClientsVue,
        EditClientsVue,
        CreateClientsVue
    },
    setup() {
        const dataUsers = ref([]);
        const idCuenta = ref('');
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData()
        })

        const loadData = async () => {
            const responseClients = await findAllClientsToAccountApi(store.state.codcuenta)
            idCuenta.value = responseClients.data.data[0].ID
            const clientes = responseClients.data.data[0].clientes ? responseClients.data.data[0].clientes : []
            dataUsers.value = clientes.filter(cliente => cliente.rol == "Administrador")
        }

        const onCreateItem = (data) => {
            if (data.initials != "" && data.username != "" && data.password != "" && data.businessName != "" && data.businessCode != "" && data.email != "") {
                const newData = {
                    "id": idCuenta.value,
                    "cod_cliente": "",
                    "cod_cuenta": store.state.codcuenta,
                    "contrasena": md5(data.password),
                    "sigla": data.initials,
                    "usuario": data.username,
                    "ruc": data.businessCode,
                    "correo": data.email,
                    "nombre_completo": "",
                    "nombre_contacto1": "",
                    "telefono_contacto1": "",
                    "codigo_turno": "",
                    "nombre_contacto2": "",
                    "telefono_contacto2": "",
                    "empresa": data.businessName,
                    "rol": "Administrador",
                    "estado": true
                }
                createClientsApi(newData)
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
                deleteClientsApi(newData)
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
                "id": idCuenta.value,
                "cod_cliente": editItem.value.item.cod_cliente,
                "cod_cuenta": store.state.codcuenta,
                "contrasena": editItem.value.item.contrasena == data.password ? data.password : md5(data.password),
                "sigla": data.initials,
                "usuario": data.username,
                "ruc": data.businessCode,
                "correo": data.email,
                "nombre_completo": editItem.value.item.nombre_completo,
                "nombre_contacto1": editItem.value.item.nombre_contacto1,
                "telefono_contacto1": editItem.value.item.telefono_contacto1,
                "codigo_turno": "",
                "nombre_contacto2": editItem.value.item.nombre_contacto2,
                "telefono_contacto2": editItem.value.item.telefono_contacto2,
                "empresa": data.businessName,
                "rol": "Administrador",
                "estado": data.state,
            }
            editClientsApi(newData)
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