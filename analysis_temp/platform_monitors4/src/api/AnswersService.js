import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function findAllAnswersApi(cod_cliente) {
    return axios.post(`${baseURL}/allResponses`,
        {
            cod_cliente
        })
}

export function createAnswersApi(data) {
    return axios.post(`${baseURL}/createResponse`, data)
}

export function updateAnswersApi(data) {
    return axios.put(`${baseURL}/editResponse`, data)
}

export function deleteAnswersApi(data) {
    return axios.post(`${baseURL}/deleteResponse`, data)
}