import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllClientsToAccountApi(cod_cuenta) {
    return axios.post(`${baseURL}/listAccounts`,
        {
            cod_cuenta,
        })
}

export function findAllClientsApi(cod_cuenta, empresa) {
    return axios.post(`${baseURL}/listClients`,
        {
            cod_cuenta,
            empresa
        })
}

export function createClientsApi(data) {
    return axios.post(`${baseURL}/createClient`, data)
}

export function editClientsApi(data) {
    return axios.put(`${baseURL}/editClient`, data)
}


export function deleteClientsApi(data) {
    return axios.post(`${baseURL}/deleteClient`, data)
}

export function repeatUserApi(usuario) {
    return axios.post(`${baseURL}/repeatUser`,
        {
            usuario,
        })
}