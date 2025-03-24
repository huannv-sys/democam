import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllUnitsApi(cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/allUnits`,
        {
            cod_cuenta,
            cod_cliente
        })
}

export function createUnitsApi(data) {
    return axios.post(`${baseURL}/createUnits`, data)
}

export function updateUnitsApi(data) {
    return axios.put(`${baseURL}/editUnits`, data)
}

export function deleteUnitsApi(data) {
    return axios.post(`${baseURL}/deleteUnits`, data)
}