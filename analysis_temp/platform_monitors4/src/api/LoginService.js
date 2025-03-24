import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function loginApi(usuario, contrasena) {
    return axios.post(`${baseURL}/login`,
        {
            usuario,
            contrasena
        })
}