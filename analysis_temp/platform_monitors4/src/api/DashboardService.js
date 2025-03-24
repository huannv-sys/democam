import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function homeClientsApi(cod_cuenta, cod_cliente, usuario, cod_regla) {
    return axios.post(`${baseURL}/home/clientes`,
        {
            cod_cuenta,
            cod_cliente,
            usuario,
            cod_regla
        })
}

export function homeAccountsApi(cod_cuenta, fecha_inicio, fecha_fin) {
    return axios.post(`${baseURL}/home/accounts`, {
        cod_cuenta,
        fecha_inicio,
        fecha_fin
    })
}