import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllGroupsUsersApi(cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/allGroupsUsers`,
        {
            cod_cuenta,
            cod_cliente
        })
}

export function createGroupsUsersApi(data) {
    return axios.post(`${baseURL}/createGroupUsers`,data)
}

export function deleteGroupsUsersApi(data) {
    return axios.post(`${baseURL}/deleteGroupUsers`,data)
}

export function updateGroupsUsersApi(data) {
    return axios.post(`${baseURL}/editGroupsUsers`,data)
}