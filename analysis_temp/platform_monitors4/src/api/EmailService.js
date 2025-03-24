import axios from 'axios';

const baseURL = process.env.VUE_APP_BASE_URL;

export function sendEmailsApi(data) {
    return axios.post(`${baseURL}/sendEmails`, data)
}