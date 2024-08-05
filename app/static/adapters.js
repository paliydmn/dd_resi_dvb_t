// static/js/adapters.js

document.addEventListener('DOMContentLoaded', function() {
    loadAdapters();
});

function showNewAdapterForm() {
    document.getElementById('new-adapter-modal').style.display = 'block';
}

function hideNewAdapterForm() {
    document.getElementById('new-adapter-modal').style.display = 'none';
}

function createAdapter(event) {
    event.preventDefault();
    const adapterNumber = document.getElementById('adapter-number').value;
    const modulatorNumber = document.getElementById('modulator-number').value;
    const udpUrl = document.getElementById('udp-url').value;

    fetch('/adapters/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            adapter_number: parseInt(adapterNumber),
            modulator_number: parseInt(modulatorNumber),
            udp_url: udpUrl
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        hideNewAdapterForm();
        loadAdapters();  // Reload the adapters list
    })
    .catch(error => console.error('Error:', error));
}

function scanAdapter(adapterId) {
    fetch(`/adapters/${adapterId}/scan`)
    .then(response => response.json())
    .then(data => {
        const programs = data.programs;
        const adapterDiv = document.getElementById(`adapter-${adapterId}`);
        const scanSection = document.getElementById(`scan-section-${adapterId}`);
        scanSection.innerHTML = `
            <h3>Available Channels and Streams</h3>
            <ul>
                ${Object.entries(programs).map(([programId, program]) => `
                    <li>
                        Channel: ${program.title}<br>
                        Streams:
                        <ul>
                            ${program.streams.video.map(stream => `
                                <li>Video: ID: ${stream.id} (${stream.codec})</li>
                            `).join('')}
                            ${program.streams.audio.map(stream => `
                                <li>Audio: ID: ${stream.id} (${stream.codec})</li>
                            `).join('')}
                        </ul>
                        <input type="checkbox" id="program-${programId}" data-id="${programId}" /> Select
                    </li>
                `).join('')}
            </ul>
            <button onclick="saveSelection(${adapterId})">Save</button>
        `;
    })
    .catch(error => console.error('Error:', error));
}

function saveSelection(adapterId) {
    const selectedPrograms = [];
    document.querySelectorAll(`#scan-section-${adapterId} input[type="checkbox"]:checked`).forEach(checkbox => {
        const programId = checkbox.getAttribute('data-id');
        selectedPrograms.push(parseInt(programId));
    });

    fetch(`/adapters/${adapterId}/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            selected_programs: selectedPrograms
        })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadAdapters();  // Reload the adapters list
    })
    .catch(error => console.error('Error:', error));
}

function startFFmpeg(adapterId) {
    fetch(`/adapters/${adapterId}/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadAdapters();  // Reload the adapters list
    })
    .catch(error => console.error('Error:', error));
}

function stopFFmpeg(adapterId) {
    fetch(`/adapters/${adapterId}/stop`, {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadAdapters();  // Reload the adapters list
    })
    .catch(error => console.error('Error:', error));
}

function deleteAdapter(adapterId) {
    fetch(`/adapters/${adapterId}/`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        loadAdapters();  // Reload the adapters list
    })
    .catch(error => console.error('Error:', error));
}

function loadAdapters() {
    fetch('/adapters/')
    .then(response => response.json())
    .then(data => {
        const adapterContainer = document.getElementById('existing-adapters');
        adapterContainer.innerHTML = '';  // Clear the container
        Object.entries(data).forEach(([adapterId, adapter]) => {
            const adapterDiv = document.createElement('div');
            adapterDiv.id = `adapter-${adapterId}`;
            adapterDiv.innerHTML = `
                <h3>Adapter ID (Adapter${adapter.adapter_number}/mod${adapter.modulator_number})</h3>
                <p>UDP link: ${adapter.udp_url}</p>
                <div id="scan-section-${adapterId}">
                    <!-- Scan results will be loaded here -->
                </div>
                <button onclick="scanAdapter(${adapterId})" id="scan-button-${adapterId}" ${adapter.running ? 'disabled' : ''}>Scan</button>
                <form method="post" action="/adapters/${adapterId}/start" id="start-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="startFFmpeg(${adapterId})">Start</button>
                </form>
                <form method="post" action="/adapters/${adapterId}/stop" id="stop-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="stopFFmpeg(${adapterId})">Stop</button>
                </form>
                <form method="post" action="/adapters/${adapterId}/delete" id="delete-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="deleteAdapter(${adapterId})">Delete</button>
                </form>
            `;
            adapterContainer.appendChild(adapterDiv);
        });
    })
    .catch(error => console.error('Error:', error));
}
