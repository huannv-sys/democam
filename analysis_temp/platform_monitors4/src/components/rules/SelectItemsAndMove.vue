<template>
    <div class="w-full">
      <div class="w-full rounded h-[8rem] overflow-y-auto p-2 border container_scroll" id="grupos-disponibles">
        <p v-for="group in listGroupsInitial" :key="group.nombre"
          class="p-1 pl-2 text-sm my-1 ease-in duration-100 cursor-pointer rounded-sm"
          :class="{
            'bg-blue-200': selectedItems.includes(group.nombre),
            'bg-gray-200 hover:bg-gray-300': !selectedItems.includes(group.nombre),
          }"
          @click="toggleSelection(group.nombre, $event)"
        >
          {{ truncateText(group.nombre) }}
        </p>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, watch } from "vue";
  
  export default {
    props: {
      listGroups: Array
    },
    emits: ['list-seleccionados'],
    setup(props, { emit }) {
      const listGroupsInitial = ref(props.listGroups);
      const selectedItems = ref([]);
  
      watch(() => props.listGroups, (newVal) => {
        listGroupsInitial.value = newVal;
      });
  
      watch(() => selectedItems.value, (newVal) => {
        emit('list-seleccionados', newVal);
      });
  
      const toggleSelection = (group, event) => {
        const index = selectedItems.value.indexOf(group);
        if (index > -1) {
          selectedItems.value.splice(index, 1);
        } else {
          if (!(event.ctrlKey || event.metaKey)) {
            selectedItems.value = [group];
          } else {
            selectedItems.value.push(group);
          }
          emit('list-seleccionados', selectedItems.value);
        }
      };
  
      const toggleSelectionAll = () => {
        selectedItems.value = listGroupsInitial.value.map(group => group.nombre);
      };
  
      const truncateText = (text) => {
        if (text && text.length > 25) {
          return text.slice(0, 25) + '...';
        }
        return text;
      };
  
      return {
        selectedItems,
        listGroupsInitial,
        toggleSelectionAll,
        toggleSelection,
        truncateText
      };
    }
  };
  </script>
  