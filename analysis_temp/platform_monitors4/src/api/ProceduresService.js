import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllProceduresApi(cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/allProcedures`,
        {
            cod_cuenta,
            cod_cliente
        })
}

export function createProceduresApi(data) {
    return axios.post(`${baseURL}/createProcedures`, data)
}

export function updateProceduresApi(data) {
    return axios.put(`${baseURL}/editProcedures`, data)
}

export function deleteProceduresApi(data) {
    return axios.post(`${baseURL}/deleteProcedures`, data)
}