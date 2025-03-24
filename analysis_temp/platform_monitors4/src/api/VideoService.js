import axios from 'axios';


export function convertVideoApi(link_video) {
    return axios.post(`http://143.244.144.235:3020/convert`,
        {
            video_url: link_video
        })
}
