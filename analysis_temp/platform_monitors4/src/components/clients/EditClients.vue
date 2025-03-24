<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-indigo-500 font-bold title_views">Editar cliente</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-text-field variant="outlined" label="Empresa" prepend-inner-icon="mdi-domain" color="indigo"
                        v-model="businessName"></v-text-field>
                    <v-text-field variant="outlined" label="Ruc" prepend-inner-icon="mdi-card-account-details"
                        color="indigo" v-model="businessCode" disabled></v-text-field>
                    <v-text-field variant="outlined" label="Sigla" prepend-inner-icon="mdi-signature-text" color="indigo"
                        v-model="initials"></v-text-field>
                    <v-textarea label="Correos" prepend-inner-icon="mdi-email" color="indigo" v-model="emails"
                        variant="outlined" rows="4"
                        placeholder="Separe los correos por comas: example@gmail.com, example2@gmail.com">
                    </v-textarea>
                    <v-text-field variant="outlined" label="Usuario" prepend-inner-icon="mdi-clipboard-account"
                        color="indigo" v-model="username" disabled></v-text-field>
                    <v-text-field color="indigo" :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
                        :type="visible ? 'text' : 'password'" label="Ingrese una contraseña"
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

export default {
    props: {
        itemEdit: Object,
        openModal: Boolean
    },
    emits: ['edit-item', 'cancel-item'],
    setup(props, { emit }) {
        const dialog = ref(false);
        const username = ref('');
        const businessName = ref('');
        const businessCode = ref('');
        const initials = ref('');
        const state = ref(true);
        const emails = ref('');
        const password = ref('');
        const visible = ref(false);

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        watch(() => props.itemEdit, (newVal) => {
            if (Object.keys(newVal).length !== 0) {
                businessName.value = newVal.item.empresa
                businessCode.value = newVal.item.ruc
                initials.value = newVal.item.sigla
                username.value = newVal.item.usuario
                emails.value = newVal.item.correo
                password.value = newVal.item.contrasena
                state.value = newVal.item.estado
            }
        })

        const editItem = () => {
            emit('edit-item', {
                initials: initials.value,
                username: username.value,
                password: password.value,
                email: emails.value,
                businessName: businessName.value,
                businessCode: businessCode.value,
                state: state.value
            })
            cancelItem()
        }

        const cancelItem = () => {
            emit('cancel-item')
        }

        return {
            visible,
            dialog,
            emails,
            username,
            businessName,
            businessCode,
            initials,
            state,
            password,
            editItem,
            cancelItem,
        }
    }
}
</script>