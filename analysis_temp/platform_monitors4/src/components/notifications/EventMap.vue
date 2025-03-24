<script setup>
import { onMounted, ref } from "vue";
import store from "@/store";
import L from "leaflet";

const map = ref();
const mapContainer = ref();

onMounted(() => {
    map.value = L.map(mapContainer.value).setView([51.505, -0.09], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
            '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map.value);
    getLocation(store.state.eventAtended.latitud, store.state.eventAtended.longitud)
});

function getLocation(lat, lng) {
    map.value.setView([lat, lng], 13);

    L.marker([lat, lng], { draggable: true })
        .addTo(map.value)
        .on("dragend", (event) => {
            console.log(event)
        });
}
</script>

<template>
    <div ref="mapContainer" class="lg:min-w-[47rem] md:min-w-[44rem] md:min-h-[32rem] lg:min-h-[25rem] min-h-[20rem] min-w-[20rem] w-full" style="width: 400px; height: 400px"></div>
</template>

<style scoped></style>