<template>
    <v-btn size="small" color="blue" @click="dialog = true"><v-icon icon="mdi-plus"></v-icon>
        Crear Nuevo</v-btn>
    <v-dialog v-model="dialog" width="500">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-indigo-500 font-bold title_views">Crear nuevo cliente</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Empresa" prepend-inner-icon="mdi-domain" color="indigo"
                        v-model="businessName"></v-text-field>
                    <v-text-field variant="outlined" label="Ruc" prepend-inner-icon="mdi-card-account-details"
                        color="indigo" v-model="businessCode"></v-text-field>
                    <v-text-field variant="outlined" label="Sigla" prepend-inner-icon="mdi-signature-text" color="indigo"
                        v-model="initials"></v-text-field>
                    <v-textarea label="Correos" prepend-inner-icon="mdi-email" color="indigo" v-model="emails"
                        variant="outlined" rows="4" placeholder="Separe los correos por comas: example@gmail.com, example2@gmail.com">
                    </v-textarea>
                    <v-text-field variant="outlined" label="Usuario" prepend-inner-icon="mdi-clipboard-account"
                        color="indigo" v-model="username" @input="checkUsernameAvailability" hide-details></v-text-field>
                    <span :class="statusValidateUser ? 'text-green-400' : 'text-red-400'" class="text-xs pl-3 pb-3">{{
                        messageValidateUser }}</span>
                    <v-text-field color="indigo" :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible ? 'text' : 'password'" label="Ingrese una contraseña"
                        prepend-inner-icon="mdi-lock-outline" variant="outlined" @click:append-inner="visible = !visible"
                        v-model="password"></v-text-field>
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
import { ref } from 'vue';
import { repeatUserApi } from '@/api/UsersService';

export default {
    emits: ['create-item'],
    setup(_, { emit }) {
        const dialog = ref(false);
        const username = ref('');
        const businessName = ref('');
        const businessCode = ref('');
        const initials = ref('');
        const password = ref('');
        const emails = ref('');
        const visible = ref(false);
        const statusValidateUser = ref(false);
        const messageValidateUser = ref('');

        const createItem = () => {
            if (statusValidateUser.value == true) {
                emit('create-item', {
                    initials: initials.value,
                    username: username.value,
                    password: password.value,
                    businessName: businessName.value,
                    businessCode: businessCode.value,
                    email: emails.value
                })
                cancelItem()
            }
        }

        const cancelItem = () => {
            username.value = initials.value = businessName.value = ""
            password.value = messageValidateUser.value = businessCode.value = ""
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

        return {
            visible,
            dialog,
            emails,
            username,
            initials,
            password,
            businessName,
            businessCode,
            messageValidateUser,
            statusValidateUser,
            createItem,
            cancelItem,
            checkUsernameAvailability
        }
    }
}
</script>