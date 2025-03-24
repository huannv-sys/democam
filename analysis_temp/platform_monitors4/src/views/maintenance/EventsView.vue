<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Tipo de eventos</h1>
            </div>
            <CreateEventsVue @create-item="onCreateItem" />
        </div>
        <TableEventsVue :desserts="listEventsData" @delete-item="onDeleteItem" @edit-item="onEditItem" />
    </div>
    <EditEventsVue :openModal="editDialog" :itemEdit="editEvent" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
import { findAllEventsApi, createEventsApi, deleteEventsApi, updateEventsApi } from '@/api/EventsService';
import CreateEventsVue from '@/components/events/CreateEvents.vue';
import EditEventsVue from '@/components/events/EditEvents.vue';
import TableEventsVue from '@/components/events/TableEvents.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from 'vue';
import store from '@/store';

export default ({
    components: {
        CreateEventsVue,
        TableEventsVue,
        EditEventsVue
    },
    setup() {
        const listEventsData = ref([]);
        const editEvent = ref({});
        const editDialog = ref(false);

        onMounted(async () => {
            await loadData();
        }) 

        const loadData = async () => {
            await findAllEventsApi(store.state.codcuenta, store.state.codclienteAdmin)
                .then(response => {
                    listEventsData.value = response.data.data ? response.data.data[0].eventos : []
                })
        }

        const obtenerFechaActual = () => {
            const fechaActual = new Date();
            const dia = String(fechaActual.getDate()).padStart(2, '0');
            const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
            const anio = fechaActual.getFullYear();
            const fechaFormateada = `${dia}-${mes}-${anio}`;
            return fechaFormateada;
        }

        const onCreateItem = (data) => {
            if (data.cod_evento != "" && data.descripcion != "" && data.prioridad != "") {
                data.cod_cliente = store.state.codclienteAdmin
                data.cod_cuenta = store.state.codcuenta
                data.usuario = store.state.username
                data.status = true
                data.fecha_creacion = obtenerFechaActual()
                createEventsApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha creado el evento correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro crear el evento')
                    })
            } else {
                basicAlert(() => { }, 'warning', 'Advertencia', 'Rellene todos los campos')
            }
        }

        const onEditItem = (data) => {
            editEvent.value = data
            editDialog.value = true
        }

        const onUpdateItem = (data) => {
            updateEventsApi(data)
                .then(() => {
                    basicAlert(async () => {
                        await loadData();
                    }, 'success', 'Logrado', 'Se ha editado el evento correctamente')
                })
                .catch(() => {
                    basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro editar el evento')
                })
        }

        const onDeleteItem = (item) => {
            const data = {
                "cod_evento": item.item.cod_evento,
                "cod_cuenta": store.state.codcuenta,
                "cod_cliente": store.state.codclienteAdmin
            }
            confirmBasic(async () => {
                await deleteEventsApi(data)
                    .then(() => {
                        basicAlert(async () => {
                            await loadData();
                        }, 'success', 'Logrado', 'Se ha eliminado el evento correctamente')
                    })
                    .catch(() => {
                        basicAlert(() => { }, 'error', 'Hubo un error', 'No se logro eliminar el evento')
                    })
            }, '¿Estás seguro de eliminar este evento?', 'Aceptar');
        }

        return {
            onCreateItem,
            onUpdateItem,
            onDeleteItem,
            onEditItem,
            editEvent,
            editDialog,
            listEventsData
        }
    }
})
</script>