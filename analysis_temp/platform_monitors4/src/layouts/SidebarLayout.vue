<template>
    <v-list>
        <div v-for="itemNavegation in itemsNavegation" :key="itemNavegation.value">
            <router-link :to="itemNavegation.to" v-if="itemNavegation.children.length == 0">
                <v-list-item :prepend-icon="itemNavegation.icon" :title="itemNavegation.title"
                    :value="itemNavegation.value"></v-list-item>
            </router-link>
            <v-list-group v-else :value="itemNavegation.value" fluid>
                <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props" :prepend-icon="itemNavegation.icon" :title="itemNavegation.title"
                        active-class="bg-indigo-lighten-1"></v-list-item>
                </template>
                <div :class="{'my-2 border-l-4 border-indigo-500 ml-3': !rail, 'my-2 border-l-4 border-indigo-500': rail}" class="">
                    <router-link :to="item.to" v-for="item in itemNavegation.children" :key="item.value" class="rounded-md">
                        <v-list-item :prepend-icon="item.icon" :title="item.title" :value="item.value" active-class="bg-indigo-darken-1 rounded-md"></v-list-item>
                    </router-link>
                </div>
            </v-list-group>
        </div>
    </v-list>
</template>
<script>
export default ({
    props: {
        rail: Boolean,
        itemsNavegation: Array
    },
})
</script>
