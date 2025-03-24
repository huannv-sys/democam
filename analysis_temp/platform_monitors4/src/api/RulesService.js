import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllRulesApi(cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/allRoules`,
        {
            cod_cuenta,
            cod_cliente
        })
}

export function createRulesApi(data) {
    return axios.post(`${baseURL}/createRoules`, data)
}

export function updateRulesApi(data) {
    return axios.post(`${baseURL}/editRoules`, data)
}

export function deleteRulesApi(data) {
    return axios.post(`${baseURL}/deleteRoules`, data)
}