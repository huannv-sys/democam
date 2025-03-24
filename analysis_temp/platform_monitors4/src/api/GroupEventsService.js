import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllGroupsEventsApi(cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/allGroupsEventtypes`,
        {
            cod_cuenta,
            cod_cliente
        })
}

export function createGroupsEventsApi(data) {
    return axios.post(`${baseURL}/createGroupEventtypes`,data)
}

export function deleteGroupsEventsApi(data) {
    return axios.post(`${baseURL}/deleteGroupEventtypes`,data)
}

export function updateGroupsEventsApi(data) {
    return axios.post(`${baseURL}/editGroupsEventtypes`,data)
}