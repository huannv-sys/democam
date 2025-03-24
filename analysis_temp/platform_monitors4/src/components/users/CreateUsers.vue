<template>
    <v-btn size="small" color="blue" @click="dialog = true"><v-icon icon="mdi-plus"></v-icon>
        Crear Nuevo</v-btn>
    <v-dialog v-model="dialog" width="500">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-indigo-500 font-bold title_views">Crear nuevo usuario</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Nombre" prepend-inner-icon="mdi-text-account" color="indigo"
                        v-model="name"></v-text-field>
                    <v-text-field variant="outlined" label="Usuario" prepend-inner-icon="mdi-clipboard-account"
                        color="indigo" v-model="username" @input="checkUsernameAvailability" hide-details></v-text-field>
                    <span :class="statusValidateUser ? 'text-green-400' : 'text-red-400'" class="text-xs pl-3 pb-1">{{
                        messageValidateUser }}</span>
                    <v-select prepend-inner-icon="mdi-shield-account" label="Rol" :items="['Operador', 'Supervisor']"
                        variant="outlined" class="col-span-2" color="indigo" v-model="role"></v-select>
                    <v-select prepend-inner-icon="mdi-account-clock" label="Turno"
                        :items="shiftsData.map(shift => shift.descripcion)" variant="outlined" class="col-span-2"
                        color="indigo" v-model="shift" v-if="role == 'Operador'"></v-select>
                    <v-text-field color="indigo" :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible ? 'text' : 'password'" label="Ingrese una contraseña"
                        prepend-inner-icon="mdi-lock-outline" variant="outlined" @click:append-inner="visible = !visible"
                        v-model="password"></v-text-field>
                    <v-text-field color="indigo" :append-inner-icon="visible2 ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible2 ? 'text' : 'password'" label="Repetir contraseña"
                        prepend-inner-icon="mdi-lock-outline" variant="outlined" @click:append-inner="visible2 = !visible2"
                        v-model="passwordRepeat" hide-details></v-text-field>
                    <span :class="statusValidatePassword ? 'text-green-400' : 'text-red-400'" class="text-xs pl-3 pb-1">{{
                        messageValidatePassword }}</span>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-grey-lighten-2" variant="tonal" @click="cancelItem">
                    Cancelar
                </v-btn>
                <v-btn color="blue-lighten-1" variant="tonal" @click="createItem">
                    Aceptar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { ref, watch } from 'vue';
import { findAllShiftsApi } from '@/api/ShiftsService';
import { repeatUserApi } from '@/api/UsersService';
import store from '@/store';

export default {
    emits: ['create-item'],
    setup(_, { emit }) {
        const dialog = ref(false);
        const name = ref('');
        const role = ref('');
        const shift = ref('');
        const username = ref('');
        const shiftsData = ref([]);
        const password = ref('');
        const passwordRepeat = ref('');
        const visible = ref(false);
        const visible2 = ref(false);
        const statusValidateUser = ref(false);
        const messageValidateUser = ref('');
        const statusValidatePassword = ref(false);
        const messageValidatePassword = ref('');

        watch(() => dialog.value, (newVal) => {
            if (newVal) {
                findAllShiftsApi(store.state.codcuenta, store.state.codclienteAdmin)
                    .then(response => {
                        shiftsData.value = response.data.data[0].turnos
                    })
            }
        })

        const createItem = () => {
            if (statusValidatePassword.value == true && statusValidateUser.value == true) {
                emit('create-item', {
                    name: name.value,
                    username: username.value,
                    role: role.value,
                    shift: shift.value,
                    password: password.value
                })
                cancelItem()
            }
        }

        const cancelItem = () => {
            name.value = role.value = shift.value = username.value = ""
            password.value = passwordRepeat.value = messageValidateUser.value = messageValidatePassword.value = ""
            dialog.value = false
        }

        const checkUsernameAvailability = () => {
            if (username.value != "") {
                if (username.value.length >= 5) {
                    repeatUserApi(username.value)
                        .then(response => {
                            messageValidateUser.value = response.data.message;
                            statusValidateUser.value = response.data.status;
                        })
                        .catch(error => {
                            messageValidateUser.value = error.response.data.message;
                            statusValidateUser.value = error.response.data.status;
                        })
                } else {
                    messageValidateUser.value = "El username debe tener al menos 5 caracteres";
                    statusValidateUser.value = false;
                }
            } else {
                messageValidateUser.value = "Campo obligatorio"
                statusValidateUser.value = false
            }
        }

        watch(() => passwordRepeat.value, (newVal) => {
            if (password.value != "") {
                if (newVal == password.value) {
                    messageValidatePassword.value = "Las contraseñas coinciden"
                    statusValidatePassword.value = true
                } else {
                    messageValidatePassword.value = "Las contraseñas no coinciden"
                    statusValidatePassword.value = false
                }
            }
        })

        return {
            visible,
            visible2,
            dialog,
            name,
            username,
            role,
            shift,
            shiftsData,
            password,
            passwordRepeat,
            messageValidateUser,
            statusValidateUser,
            statusValidatePassword,
            messageValidatePassword,
            createItem,
            cancelItem,
            checkUsernameAvailability
        }
    }
}
</script>