<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Vehiculos</h1>
            </div>
            <CreateVehiclesAccountsVue @create-item="onCreateItem" />
        </div>
        <TableVehiclesAccountsVue :desserts="listUnitsData" @edit-item="onEditItem" @delete-item="onDeleteItem" />
    </div>
    <EditVehiclesVue :openModal="editDialog" :itemEdit="editItem" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
import { findAllUnitsApi, createUnitsApi, updateUnitsApi, deleteUnitsApi } from '@/api/VehiclesService';
import { findAllClientsToAccountApi } from '@/api/UsersService';
import TableVehiclesAccountsVue from "@/components/vehicles/TableVehiclesAccounts.vue";
import CreateVehiclesAccountsVue from '@/components/vehicles/CreateVehiclesAccounts.vue';
import EditVehiclesVue from '@/components/vehicles/EditVehicles.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from "vue";
import store from '@/store';


export default ({
    components: {
        TableVehiclesAccountsVue,
        CreateVehiclesAccountsVue,
        EditVehiclesVue
    },
    setup() {
        const listUnitsData = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);
        const clientsAdmin = ref('');

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            const [responseUnits, responseClients] = await Promise.all([
                findAllUnitsApi(store.state.codcuenta, store.state.codclienteAdmin),
                findAllClientsToAccountApi(store.state.codcuenta)
            ])
            const clientes = responseClients.data.data[0].clientes ? responseClients.data.data[0].clientes : []
            clientsAdmin.value = clientes.filter(cliente => cliente.rol == "Administrador")
            const units = responseUnits.data.data ? responseUnits.data.data : []
            listUnitsData.value = units.flatMap(clientunit => {
                const client = clientsAdmin.value.find(client => client.cod_cliente == clientunit.cod_cliente)
                const units = clientunit.unidades.map(unit => {
                    return { ...unit, empresa: client.empresa }
                })
                return units
            })
        }

        const onCreateItem = (data) => {
            if (data.placa != "") {
                createUnitsApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha registrado el vehiculo correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro registrar el vehiculo')
                    })
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Rellene todos los campos')
            }
        }

        const onDeleteItem = (item) => {
            const data = {
                "placa": item.item.placa,
                "cod_unidad": item.item.cod_unidad,
                "cod_cuenta": store.state.codcuenta,
                "cod_cliente": clientsAdmin.value.find(client => client.empresa == item.item.empresa).cod_cliente
            }
            confirmBasic(async () => {
                await deleteUnitsApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha eliminado el vehículo correctamente')
                    })
                    .catch(error => {
                        console.log(error)
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro eliminar')
                    })
            }, '¿Estás seguro de eliminar este vehículo?', 'Aceptar');
        }

        const onEditItem = (data) => {
            editItem.value = data
            editDialog.value = true
        }

        const onUpdateItem = (data) => {
            data.cod_cliente = clientsAdmin.value.find(client => client.empresa == editItem.value.item.empresa).cod_cliente
            updateUnitsApi(data)
                .then(() => {
                    basicAlert(async () => {
                        await loadData();
                    }, 'success', 'Logrado', 'Se ha editado el vehículo correctamente')
                })
                .catch(() => {
                    basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro editar el vehículo')
                })
        }

        return {
            listUnitsData,
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