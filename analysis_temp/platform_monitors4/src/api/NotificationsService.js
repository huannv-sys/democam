import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function notificationsAccountApi(cod_cuenta, cod_cliente, usuario, codigo) {
    return axios.post(`${baseURL}/notifications/Account`,
        {
            cod_cuenta,
            cod_cliente,
            usuario,
            codigo
        })
}

export function massDiscardofEventsApi(eventsId, cod_cuenta, cod_cliente) {
    return axios.post(`${baseURL}/massiveDiscard`,
        {
            "ids": eventsId,
            cod_cliente,
            cod_cuenta,
            "descripcion_estado": "Descartado",
            "estado": 1
        })
}

export function addCommentEventsApi(data) {
    return axios.post(`${baseURL}/addComment`, data)
}

export function notificationsLogsApi(data) {
    return axios.post(`${baseURL}/allNotifications`, data)
}

export function notificationsByIdApi(data) {
    return axios.post(`${baseURL}/notificationsById`, data)
}