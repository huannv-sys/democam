<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Turnos</h1>
            </div>
            <CreateShiftsVue @create-item="onCreateItem" />
        </div>
        <TableShiftsVue :desserts="listShiftsData" @edit-item="onEditItem" />
    </div>
    <EditShiftsVue :openModal="editDialog" :itemEdit="editItem" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
import { findAllShiftsApi, createShiftsApi, updateShiftsApi } from '@/api/ShiftsService';
import TableShiftsVue from "@/components/shifts/TableShifts.vue";
import CreateShiftsVue from '@/components/shifts/CreateShifts.vue';
import EditShiftsVue from '@/components/shifts/EditShifts.vue';
import { basicAlert } from '@/helpers/SweetAlert';
import { onMounted, ref } from "vue";
import store from '@/store';


export default ({
    components: {
        TableShiftsVue,
        CreateShiftsVue,
        EditShiftsVue
    },
    setup() {
        const listShiftsData = ref([]);
        const editItem = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            findAllShiftsApi(store.state.codcuenta, store.state.codclienteAdmin)
                .then(response => {
                    listShiftsData.value = response.data.data[0].turnos
                })
        }

        const onCreateItem = (data) => {
            if (data.descripcion != "" && data.desde != "" && data.hasta != "") {
                createShiftsApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha creado el turno correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro crear el turno')
                    })
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Rellene todos los campos')
            }
        }

        // const onDeleteItem = (item) => {
        //     const data = {
        //         "codigo": item.item.codigo,
        //         "cod_cuenta": store.state.codcuenta,
        //         "cod_cliente": store.state.codcliente
        //     }
        //     console.log(data)
        //     confirmBasic(async () => {
        //         await deleteAnswersApi(data)
        //             .then(() => {
        //                 basicAlert(async () => {
        //                     await loadData();
        //                 }, 'success', 'Logrado', 'Se ha eliminado la respuesta predefinida correctamente')
        //             })
        //             .catch(error => {
        //                 console.log(error)
        //                 basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro eliminar')
        //             })
        //     }, '¿Estás seguro de eliminar esta respuesta predefinida?', 'Aceptar');
        // }

        const onEditItem = (data) => {
            editItem.value = data
            editDialog.value = true
        }

        const onUpdateItem = (data) => {
            updateShiftsApi(data)
                .then(() => {
                    basicAlert(async () => {
                        await loadData();
                    }, 'success', 'Logrado', 'Se ha editado el turno correctamente')
                })
                .catch(() => {
                    basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro editar el turno')
                })
        }

        return {
            listShiftsData,
            editDialog,
            editItem,
            onUpdateItem,
            // onDeleteItem,
            onCreateItem,
            onEditItem
        }
    }
})
</script>