<template>
    <div class="bg-white rounded-lg p-5 grid grid-cols-4 shadow-md items-center">
        <div class="col-span-1 flex items-center justify-start">
            <div class="rounded-lg text-white w-full flex justify-center h-[4rem] items-center" :class="BgCard">
                <v-icon size="large">{{ Icon }}</v-icon>
            </div>
        </div>
        <div class="col-span-3 pl-3 text-gray-500">
            <p>{{ Title }}</p>
            <p class="text-2xl font-bold pt-3">{{ Amount }}</p>
        </div>
    </div>
</template>
<script>
export default ({
    props: {
        BgCard: String,
        Icon: String,
        Amount: Number,
        Title: String
    }
})
</script>