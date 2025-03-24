<template>
    <v-dialog v-model="dialog" width="500" @click:outside="cancelItem">
        <v-card>
            <v-toolbar>
                <span class="px-4 w-full text-center text-blue-400 font-bold title_views">{{ nameGrupo }}</span>
            </v-toolbar>
            <v-card-text>
                <v-col cols="12">
                    <v-expansion-panels multiple>
                        <v-expansion-panel v-for="group in itemsView" :key="group.codigo">
                            <v-expansion-panel-title color="blue-grey-lighten-5">
                                <span>{{ group.nombre }}</span>
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="max-h-[7rem] overflow-y-auto container_scroll">
                                    <div class="bg-blue-200 rounded-sm p-1 px-3 w-full my-1 text-sm"
                                        v-for="item in group.items" :key="item" size="small">
                                        {{ item }}
                                    </div>
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-col>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue-lighten-1" variant="tonal" @click="cancelItem">
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
        nameGrupo: String,
        itemsView: Array,
        openModal: Boolean
    },
    emits: ['cancel-item'],
    setup(props, { emit }) {
        const dialog = ref(false);

        watch(() => props.openModal, (newVal) => {
            dialog.value = newVal
        })

        const cancelItem = () => {
            emit('cancel-item')
        }

        return {
            dialog,
            cancelItem
        }
    }
}
</script>
