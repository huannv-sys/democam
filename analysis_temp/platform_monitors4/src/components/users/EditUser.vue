<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-indigo-500 font-bold title_views">Editar usuario</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Nombre" prepend-inner-icon="mdi-text-account" color="indigo"
                        v-model="name"></v-text-field>
                    <v-text-field variant="outlined" label="Usuario" prepend-inner-icon="mdi-clipboard-account"
                        color="indigo" v-model="username" disabled></v-text-field>
                    <v-select prepend-inner-icon="mdi-shield-account" label="Rol" :items="['Operador', 'Supervisor']"
                        variant="outlined" class="col-span-2" color="indigo" v-model="role" disabled></v-select>
                    <v-select prepend-inner-icon="mdi-account-clock" label="Turno"
                        :items="shiftsData.map(shift => shift.descripcion)" variant="outlined" class="col-span-2"
                        color="indigo" v-model="shift" v-if="role == 'Operador'"></v-select>
                    <v-text-field color="indigo" :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible ? 'text' : 'password'" label="Ingrese su contraseña"
                        prepend-inner-icon="mdi-lock-outline" variant="outlined" @click:append-inner="visible = !visible"
                        v-model="password" hide-details></v-text-field>
                        <v-switch label="Estado" v-model="state" color="blue" hide-details></v-switch>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-grey-lighten-2" variant="tonal" @click="cancelItem">
                    Cancelar
                </v-btn>
                <v-btn color="blue-lighten-1" variant="tonal" @click="editItem">
                    Aceptar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { ref, watch } from 'vue';
import { findAllShiftsApi } from '@/api/ShiftsService';
import store from '@/store';

export default {
    props: {
        itemEdit: Object,
        openModal: Boolean
    },
    emits: ['edit-item', 'cancel-item'],
    setup(props, { emit }) {
        const dialog = ref(false);
        const name = ref('');
        const role = ref('');
        const shift = ref('');
        const username = ref('');
        const state = ref(true);
        const shiftsData = ref([]);
        const password = ref('');
        const visible = ref(false);
        const visible2 = ref(false);

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
            if (newVal) {
                findAllShiftsApi(store.state.codcuenta, store.state.codclienteAdmin)
                    .then(response => {
                        shiftsData.value = response.data.data[0].turnos
                    })
            }
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                name.value = newVal.item.nombre_completo
                username.value = newVal.item.usuario
                role.value = newVal.item.rol
                shift.value = newVal.item.turno
                password.value = newVal.item.contrasena
                state.value = newVal.item.estado
            }
        })

        const editItem = () => {
            emit('edit-item', {
                name: name.value,
                username: username.value,
                role: role.value,
                shift: shift.value,
                password: password.value,
                state: state.value
            })
            cancelItem()
        }

        const cancelItem = () => {
            name.value = role.value = shift.value = username.value = ""
            password.value = ""
            emit('cancel-item')
        }

        return {
            visible,
            visible2,
            dialog,
            name,
            username,
            role,
            shift,
            state,
            shiftsData,
            password,
            editItem,
            cancelItem,
        }
    }
}
</script>