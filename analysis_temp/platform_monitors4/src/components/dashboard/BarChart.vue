<template>
    <div class="min-h-[15rem]">
        <Bar :data="data" :options="options" />
    </div>
</template>
<script>
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale
} from 'chart.js'
import { Bar } from 'vue-chartjs';
import { ref, watch } from 'vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)
export default {
    name: 'BarChart',
    components: {
        Bar
    },
    props: {
        dataChart: Array
    },
    setup(props) {
        const data = ref(
            {
                labels: [],
                datasets: [
                    {
                        backgroundColor: [
                            '#FFD700', // Amarillo pastel
                            '#B2FF66', // Verde pastel
                            '#AEC6CF', // Azul grisáceo pastel
                            '#ADD8E6', // Azul claro
                            '#87CEEB', // Azul cielo
                            '#98FB98', // Verde claro
                            '#FFFACD', // Beige
                            '#F0E68C', // Amarillo claro
                            '#F5DEB3', // Trigo
                            '#FFA07A', // Salmón claro
                            '#FFEBCD', // Blanco antiguo
                            '#D8BFD8', // Lavanda
                            '#FAEBD7', // Blanco almendra
                            '#F0F8FF', // Azul Alice
                            '#FFFFE0',
                            '#E0FFFF',
                            '#F5F5DC',
                            '#FFEFD5'
                        ],
                        data: []
                    }
                ]
            }
        );

        watch(() => props.dataChart, (newVal) => {
            if (newVal.length > 0) {
                const dataChart = props.dataChart.map(data => data.empresa);
                const filledData = Array.from({ length: Math.max(6 - dataChart.length, 0) }, () => '');

                const labels = dataChart.concat(filledData);
                data.value = {
                    // labels: props.dataChart.map(data => data.empresa),
                    labels: labels,
                    datasets: [
                        {
                            label: 'Eventos',
                            backgroundColor: [
                                '#FFD700', // Amarillo pastel
                                '#B2FF66', // Verde pastel
                                '#AEC6CF', // Azul grisáceo pastel
                                '#ADD8E6', // Azul claro
                                '#87CEEB', // Azul cielo
                                '#98FB98', // Verde claro
                                '#FFFACD', // Beige
                                '#F0E68C', // Amarillo claro
                                '#F5DEB3', // Trigo
                                '#FFA07A', // Salmón claro
                                '#FFEBCD', // Blanco antiguo
                                '#D8BFD8', // Lavanda
                                '#FAEBD7', // Blanco almendra
                                '#F0F8FF', // Azul Alice
                                '#FFFFE0',
                                '#E0FFFF',
                                '#F5F5DC',
                                '#FFEFD5'
                            ],
                            data: props.dataChart.map(data => data.eventos)
                        }
                    ]
                }
            }
        })

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
        return {
            options,
            data
        }
    }
}
</script>