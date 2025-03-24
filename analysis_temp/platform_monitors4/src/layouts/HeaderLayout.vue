<template>
    <div class="w-full bg-white flex justify-between items-center px-3 container-header shadow-sm">
        <v-btn variant="text" icon="mdi-menu" color="blue-grey-lighten-1" class="cursor-pointer btn-action-sidebar"
            @click.stop="onActionRail"></v-btn>
        <div class="flex items-center text-start text-xs">
            <v-list>
                <v-list-item class="text-start text-xs item-personalizado" :prepend-avatar="avatarPath"
                    :title="`Hola, ${username}`" :subtitle="rol">
                </v-list-item>
            </v-list>
            <MenuAsPopover />
        </div>
    </div>
</template>
<script>
import store from '@/store';
import MenuAsPopover from '@/components/general/MenuAsPopover.vue';

export default ({
    components: {
        MenuAsPopover
    },
    props: {
        avatarPath: String
    },
    data() {
        return {
            username: store.state.username,
            codcliente: store.state.codclienteAdmin,
            rol: store.state.rol,
        }
    },
    emits: ['action-rail'],
    setup(_, { emit }) {

        const onActionRail = () => {
            emit('action-rail')
        }

        return {
            onActionRail
        }
    }
})
</script>
<style scoped>
/* CSS para teléfonos móviles */
@media (max-width: 1000px) {
    .container-header {
        justify-content: end !important;
    }

    .btn-action-sidebar {
        display: none !important;
    }
}
</style>