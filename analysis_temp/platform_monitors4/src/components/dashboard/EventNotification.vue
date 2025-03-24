<template>
    <div class="shadow-md bg-white rounded-lg overflow-hidden">
        <table class="table-auto w-full">
            <thead class="border-b">
                <tr>
                    <th class="p-3 font-medium text-gray-600">Evento</th>
                    <th class="p-3 font-medium text-gray-600">Cantidad</th>
                    <th class="p-3 font-medium text-gray-600">Porcentaje</th>
                </tr>
            </thead>
            <tbody class="text-center container_items text-gray-500">
                <tr v-for="item in data" :key="item.clave">
                    <td class="p-3">{{ item.clave }}</td>
                    <td class="p-3">{{ item.valor }}</td>
                    <td class="p-3">
                        <p class="text-center text-xs">{{ item.porcentaje }}%</p>
                        <div class="w-full bg-gray-300 rounded-full">
                            <div class="bg-blue-400 text-xs font-medium text-white text-center p-1 leading-none rounded-l-lg"
                                :style="{ width: item.porcentaje + '%' }"></div>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
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