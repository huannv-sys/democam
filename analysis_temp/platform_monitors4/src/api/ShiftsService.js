import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllShiftsApi(cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/allShifts`,
        {
            cod_cuenta,
            cod_cliente
        })
}

export function createShiftsApi(data) {
    return axios.post(`${baseURL}/createShifts`, data)
}

export function updateShiftsApi(data) {
    return axios.put(`${baseURL}/editShifts`, data)
}

export function deleteShiftsApi(data) {
    return axios.post(`${baseURL}/deleteShifts`, data)
}