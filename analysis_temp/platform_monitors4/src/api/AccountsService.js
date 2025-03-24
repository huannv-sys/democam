import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;


export function createAccountsApi(data) {
    return axios.post(`${baseURL}/createAccount`, data)
}

export function editAccountsApi(data) {
    return axios.put(`${baseURL}/editAccount`, data)
}

export function deleteAccountsApi(data) {
    return axios.post(`${baseURL}/deleteClient`, data)
}
