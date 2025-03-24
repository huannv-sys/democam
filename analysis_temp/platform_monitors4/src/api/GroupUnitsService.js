import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllGroupsUnitsApi(cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/allGroupsUnits`,
        {
            cod_cuenta,
            cod_cliente
        })
}

export function createGroupsUnitsApi(data) {
    return axios.post(`${baseURL}/createGroupUnits`,data)
}

export function deleteGroupsUnitsApi(data) {
    return axios.post(`${baseURL}/deleteGroupUnits`,data)
}

export function updateGroupsUnitsApi(data) {
    return axios.post(`${baseURL}/editGroupsUnits`,data)
}