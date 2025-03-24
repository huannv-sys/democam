<template>
    <v-btn color="teal-lighten-2" size="small" class="my-1 md:my-0" @click="dialog = true">Escalar</v-btn>
    <v-dialog v-model="dialog" width="450">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">Escalar evento</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12" class="overflow-y-auto max-[300px]">
                    <p class="text-gray-400">Seleccione a los correos que desea escalar el evento: </p>
                    <div class="w-full rounded-md flex gap-2 py-2 text-xs" v-for="(email, index) in emailList"
                        :key="index">
                        <v-checkbox :label="email" color="indigo" :value="email" hide-details class="text-xs"
                            v-model="selectedEmail" density="small"></v-checkbox>
                    </div>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-grey-lighten-2" variant="tonal" @click="dialog = false">
                    Cancelar
                </v-btn>
                <v-btn color="blue-lighten-1" variant="tonal" @click="sendEmail">
                    Aceptar
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { ref, onMounted } from 'vue';
import store from '@/store';

export default {
    emits: ['send-email'],
    setup(_, { emit }) {
        const dialog = ref(false);
        const emailList = ref([]);
        const selectedEmail = ref([]);

        const sendEmail = () => {
            emit('send-email', {
                selectedEmail: selectedEmail.value
            })
            selectedEmail.value = []
            dialog.value = false
        }

        onMounted(() => {
            const emailString = store.state.email;
            const emails = emailString.split(",").map(email => email.trim());
            emailList.value = emails;
        })

        return {
            dialog,
            sendEmail,
            emailList,
            selectedEmail
        }
    }
}
</script>