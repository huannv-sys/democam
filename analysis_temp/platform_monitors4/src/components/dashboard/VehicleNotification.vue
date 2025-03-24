<template>
    <div class="h-full shadow-md bg-white rounded-lg">
        <p class="border-b p-3 font-medium text-gray-600 text-center">
            Notificaciones por vehiculos
        </p>
        <div class="container_items container_scroll">
            <div class="p-4 flex items-center border-t" v-for="item in data" :key="item.clave">
                <span class="px-2">
                    <v-icon size="large" color="cyan-lighten-1">mdi-truck</v-icon>
                </span>
                <span class="w-full pl-2 text-gray-500">
                    {{ item.clave }}
                </span>
                <span class="font-bold text-light-green-darken-1 text-xl pr-2">
                    {{ item.valor}}
                </span>
            </div>
        </div>
    </div>
</template>
<script>
export default ({
    props: {
        data: Array
    }
})
</script>
<style scoped>
.container_items {
    max-height: 45rem;
    overflow-y: auto;
}

</style>