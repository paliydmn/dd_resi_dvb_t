const ctx = document.getElementById('temperatureChart').getContext('2d');
const data = {
    labels: [], // Time labels
    datasets: []
};
const config = {
    type: 'line',
    data: data,
    options: {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'second',
                    stepSize: 15, 
                    displayFormats: {
                        second: 'HH:mm:ss'
                    }
                },
                title: {
                    display: true,
                    text: 'Time'
                }
            },
            y: {
                beginAtZero: true,
                suggestedMax: 100,
                title: {
                    display: true,
                    text: 'C°'
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top'
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.dataset.label}: ${context.raw.y} C°`;
                    }
                }
            }
        }
    }
};
const temperatureChart = new Chart(ctx, config);

async function fetchTemperatureData() {
    try {
        const response = await fetch('/modulators/temperatures');
        const modulatorData = await response.json();
        
        const now = new Date();
        Object.entries(modulatorData).forEach(([modulatorId, temps]) => {
            ['sensor_1', 'sensor_2', 'sensor_3'].forEach((sensor, index) => {
                if (temps[sensor] !== null) {
                    const datasetLabel = `${modulatorId} Sensor ${index + 1}`;
                    let dataset = temperatureChart.data.datasets.find(ds => ds.label === datasetLabel);
                    if (!dataset) {
                        dataset = {
                            label: datasetLabel,
                            data: [],
                            borderColor: '',
                            backgroundColor: 'rgba(0,0,0,0)',
                            fill: false
                        };
                        temperatureChart.data.datasets.push(dataset);
                    }
                    dataset.data.push({
                        x: now,
                        y: temps[sensor]
                    });
                    dataset.borderColor = temps[sensor] > 65 ? 'red' : temps[sensor] > 45 ? 'yellow' : 'green';
                }
            });
        });

        // Remove old data (only keep data for the last 5 minutes)
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        temperatureChart.data.datasets.forEach(ds => {
            ds.data = ds.data.filter(d => new Date(d.x) > fiveMinutesAgo);
        });

        temperatureChart.update();
    } catch (error) {
        console.error('Error fetching temperature data:', error);
    }
}

// Fetch new data every 2 seconds
setInterval(fetchTemperatureData, 2000);
