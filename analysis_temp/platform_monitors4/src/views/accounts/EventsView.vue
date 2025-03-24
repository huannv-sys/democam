<template>
    <div>
        <div class="flex justify-between w-full">
            <div>
                <h1 class="font-bold text-xl title_poppins pb-5">Tipo de eventos</h1>
            </div>
            <CreateEventsAccountsVue @create-item="onCreateItem" />
        </div>
        <TableEventsAccountsVue :desserts="listEventsData" @delete-item="onDeleteItem" @edit-item="onEditItem" />
    </div>
    <EditEventsVue :openModal="editDialog" :itemEdit="editEvent" @cancel-item="editDialog = false"
        @edit-item="onUpdateItem" />
</template>
<script>
import { findAllEventsApi, createEventsApi, deleteEventsApi, updateEventsApi } from '@/api/EventsService';
import { findAllClientsToAccountApi } from '@/api/UsersService';
import CreateEventsAccountsVue from '@/components/events/CreateEventsAccounts.vue';
import EditEventsVue from '@/components/events/EditEvents.vue';
import TableEventsAccountsVue from '@/components/events/TableEventsAccounts.vue';
import { basicAlert, confirmBasic } from '@/helpers/SweetAlert';
import { onMounted, ref } from 'vue';
import store from '@/store';

export default ({
    components: {
        CreateEventsAccountsVue,
        TableEventsAccountsVue,
        EditEventsVue
    },
    setup() {
        const listEventsData = ref([]);
        const editEvent = ref({});
        const editDialog = ref(false);
        const clientsAdmin = ref('');
        
        onMounted(async () => {
            await loadData();
        })

        const loadData = async () => {
            const [responseEvents, responseClients] = await Promise.all([
                findAllEventsApi(store.state.codcuenta, store.state.codclienteAdmin),
                findAllClientsToAccountApi(store.state.codcuenta)
            ])
            const clientes = responseClients.data.data[0].clientes ? responseClients.data.data[0].clientes : []
            clientsAdmin.value = clientes.filter(cliente => cliente.rol == "Administrador")
            const events = responseEvents.data.data ? responseEvents.data.data : []
            listEventsData.value = events.flatMap(clientevent => {
                const client = clientsAdmin.value.find(client => client.cod_cliente == clientevent.cod_cliente)
                const eventos = clientevent.eventos.map(event => {
                    return { ...event, empresa: client.empresa }
                })
                return eventos
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
            data.cod_cliente = clientsAdmin.value.find(client => client.empresa == editEvent.value.item.empresa).cod_cliente
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
                "cod_cliente": clientsAdmin.value.find(client => client.empresa == item.item.empresa).cod_cliente
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