import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function reportEventsApi(cod_cuenta, cod_cliente, placa, cod_evento, descripcion_estado, fecha_inicio, fecha_fin, pageCount, pageNum, usuario) {
    console.log({
        cod_cuenta,
        cod_cliente,
        placa,
        cod_evento,
        usuario,
        descripcion_estado,
        fecha_inicio,
        fecha_fin,
        pageCount,
        pageNum
    })
    return axios.post(`${baseURL}/notifications/Report`,
        {
            cod_cuenta,
            cod_cliente,
            placa,
            cod_evento,
            usuario,
            descripcion_estado,
            fecha_inicio,
            fecha_fin,
            pageCount,
            pageNum
        })
}