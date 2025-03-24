<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Administrar usuarios</h1>
            </div>
            <CreateUsersVue @create-item="onCreateItem" />
        </div>
        <TableUsersVue :desserts="dataUsers" @delete-item="onDeleteItem" :shiftsDataProps="dataShifts"
            @edit-item="onEditItem" />
    </div>
    <EditUserVue :openModal="editDialog" :itemEdit="editItem" @cancel-item="editDialog = false" @edit-item="onUpdateItem" />
</template>
<script>
import { findAllClientsToAccountApi, deleteClientsApi, createClientsApi, editClientsApi } from '@/api/UsersService';
import { findAllShiftsApi } from '@/api/ShiftsService';
import { onMounted, ref } from 'vue';
import store from '@/store';
import TableUsersVue from '@/components/users/TableUsers.vue';
import CreateUsersVue from '@/components/users/CreateUsers.vue';
import EditUserVue from '@/components/users/EditUser.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import md5 from 'md5';

export default ({
    components: {
        TableUsersVue,
        EditUserVue,
        CreateUsersVue
    },
    setup() {
        const dataUsers = ref([]);
        const dataShifts = ref([]);
        const idCuenta = ref('');
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData()
        })

        const loadData = async () => {
            const [responseClients, responseShifts] = await Promise.all([
                findAllClientsToAccountApi(store.state.codcuenta),
                findAllShiftsApi(store.state.codcuenta, store.state.codclienteAdmin)
            ])
            idCuenta.value = responseClients.data.data[0].ID
            const clientes = responseClients.data.data[0].clientes ? responseClients.data.data[0].clientes : []
            dataUsers.value = clientes.filter(cliente => cliente.empresa == store.state.empresa && cliente.rol != "Administrador")
            dataShifts.value = responseShifts.data.data[0].turnos ? responseShifts.data.data[0].turnos : []
        }

        const onCreateItem = (data) => {
            if (data.password != "" && data.username != "" && data.name != "" && data.role != "") {
                const newData = {
                    "id": idCuenta.value,
                    "cod_cliente": "",
                    "cod_cuenta": store.state.codcuenta,
                    "contrasena": md5(data.password),
                    "sigla": "",
                    "usuario": data.username,
                    "ruc": store.state.ruc,
                    "nombre_completo": data.name,
                    "nombre_contacto1": "",
                    "telefono_contacto1": "",
                    "codigo_turno": data.shift.length > 0 ? dataShifts.value.find(shift => shift.descripcion == data.shift).cod_turno : '',
                    "nombre_contacto2": "",
                    "telefono_contacto2": "",
                    "empresa": store.state.empresa,
                    "rol": data.role,
                    "estado": true
                }
                createClientsApi(newData)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha creado el usuario correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro crear el usuario')
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
                        }, 'success', 'Logrado', 'Se ha eliminado el usuario correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro eliminar el usuario')
                    })
            }, '¿Estás seguro de eliminar este usuario?', 'Aceptar');
        }

        const onEditItem = (data) => {
            console.log(data)
            data.item.turno = data.item.codigo_turno.length > 0 ? dataShifts.value.find(shift => shift.cod_turno == data.item.codigo_turno).descripcion : ''
            editItem.value = data
            editDialog.value = true
        }

        const onUpdateItem = (data) => {
            const newData = {
                "id": idCuenta.value,
                "cod_cliente": editItem.value.item.cod_cliente,
                "cod_cuenta": store.state.codcuenta,
                "contrasena": editItem.value.item.contrasena == data.password ? data.password : md5(data.password),
                "sigla": editItem.value.item.sigla,
                "usuario": data.username,
                "ruc": editItem.value.item.ruc,
                "nombre_completo": data.name,
                "nombre_contacto1": editItem.value.item.nombre_contacto1,
                "telefono_contacto1": editItem.value.item.telefono_contacto1,
                "codigo_turno": data.shift.length > 0 ? dataShifts.value.find(shift => shift.descripcion == data.shift).cod_turno : '',
                "nombre_contacto2": editItem.value.item.nombre_contacto2,
                "telefono_contacto2": editItem.value.item.telefono_contacto2,
                "empresa": store.state.empresa,
                "rol": data.role,
                "estado": data.state,
            }
            editClientsApi(newData)
                .then(() => {
                    basicAlert(async () => {
                        await loadData();
                    }, 'success', 'Logrado', 'Se ha editado el usuario correctamente')
                })
                .catch(() => {
                    basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro editar el usuario')
                })
        }

        return {
            dataShifts,
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