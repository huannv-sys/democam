<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Vehiculos</h1>
            </div>
            <CreateVehiclesVue @create-item="onCreateItem" />
        </div>
        <TableVehiclesVue :desserts="listUnitsData" @edit-item="onEditItem" @delete-item="onDeleteItem"/>
    </div>
    <EditVehiclesVue :openModal="editDialog" :itemEdit="editItem" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
import { findAllUnitsApi, createUnitsApi, updateUnitsApi, deleteUnitsApi } from '@/api/VehiclesService';
import TableVehiclesVue from "@/components/vehicles/TableVehicles.vue";
import CreateVehiclesVue from '@/components/vehicles/CreateVehicles.vue';
import EditVehiclesVue from '@/components/vehicles/EditVehicles.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from "vue";
import store from '@/store';


export default ({
    components: {
        TableVehiclesVue,
        CreateVehiclesVue,
        EditVehiclesVue
    },
    setup() {
        const listUnitsData = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            findAllUnitsApi(store.state.codcuenta, store.state.codclienteAdmin)
                .then(response => {
                    listUnitsData.value = response.data.data[0].unidades
                })
        }

        const onCreateItem = (data) => {
            if (data.placa != "" ) {
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
                "cod_cliente": store.state.codclienteAdmin
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