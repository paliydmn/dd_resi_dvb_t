import { showPopup } from './popup.js';
import { updateAdapters } from '../adapters.js';

export function stopAllffmpegs() {
    fetch('/adapters/stop_all')
        .then(response => response.json())
        .then(data => {
            showPopup(data.msg, data.status);
            updateAdapters(); // Reload the adapters list
        })
        .catch(error => showPopup(error, "error"));
}

export function scanAdapter(adapterId) {
    const scanSection = document.getElementById(`scan-section-${adapterId}`);

    // Add a spinner to indicate loading
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = `<div class="loading-spinner"></div>`;
    scanSection.appendChild(spinner);

    // Fetch scan results and display them in the scan section
    fetch(`/adapters/${adapterId}/scan`)
        .then(response => response.json())
        .then(data => {
            const programs = data.programs;
            // Hide the spinner after receiving data
            scanSection.removeChild(spinner);
            if (!programs || Object.keys(programs).length === 0) {
                showPopup(data.msg, data.status);
                return;
            }

            // Hide other controls
            setAdapterControlDisplay(adapterId, false);

            // Display scan results and save/cancel buttons
            scanSection.innerHTML = `
                <h3>Available Channels and Streams</h3>
                <ul>
                    ${Object.entries(programs).map(([programId, program]) => `
                        <li>
                            <input type="checkbox" id="channel-${programId}" data-id="${programId}" onchange="updateChannelSelection(${programId})" />
                            <label for="channel-${programId}" onclick="toggleChannel(event, ${programId})">${program.title}</label><br>
                            Streams:
                            <ul>
                                ${program.streams.video.map(stream => `
                                    <li>
                                        <input type="checkbox" id="video-${stream.id}" data-channel="${programId}" data-id="${stream.id}" onchange="updateStreamSelection(${programId})"/> 
                                        <label for="video-${stream.id}" onclick="toggleStream(event, '${stream.id}')">Video: ID: ${stream.id} (${stream.codec})</label>
                                    </li>
                                `).join('')}
                                ${program.streams.audio.map(stream => `
                                    <li>
                                        <input type="checkbox" id="audio-${stream.id}" data-channel="${programId}" data-id="${stream.id}" onchange="updateStreamSelection(${programId})"/> 
                                        <label for="audio-${stream.id}" onclick="toggleStream(event, '${stream.id}')">Audio: ID: ${stream.id} (${stream.codec})</label>
                                    </li>
                                `).join('')}
                            ${program.streams.subtitle.length > 0 ? 
                                program.streams.subtitle.map(stream => `
                                    <li>
                                        <input type="checkbox" id="subtitle-${stream.id}" data-channel="${programId}" data-id="${stream.id}" onchange="updateStreamSelection(${programId})"/> 
                                        <label for="subtitle-${stream.id}" onclick="toggleStream(event, '${stream.id}')">Subtitle: ID: ${stream.id} (${stream.codec})</label>
                                    </li>
                                `).join('') : ''}
                            </ul>
                        </li>
                    `).join('')}
                </ul>
                <button onclick="saveSelection('${adapterId}')">Save Selected</button>
                <button onclick="cancelSelection('${adapterId}')">Cancel</button>
            `;
        })
        .catch(error => {
            console.error('Error:', error)
            // Hide the spinner if an error occurs
            showPopup(error, "error")
            updateAdapters(adapterId)
            scanSection.removeChild(spinner);
        });
}


export function startFFmpeg(adapterId) {
    const adapterSection = document.getElementById(`adapter-${adapterId}`);
    adapterSection.style.position = 'relative';

    // Add a spinner to indicate loading
    const spinner = document.createElement('div');
    spinner.className = 'spinner-overlay';
    spinner.innerHTML = `<div class="loading-spinner"></div>`;
    adapterSection.appendChild(spinner);

    fetch(`/adapters/${adapterId}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => {
            adapterSection.removeChild(spinner);
            showPopup(data.msg, data.status);
            updateAdapters(adapterId)
        })
        .catch(error => {
            showPopup(`Start Adapter Error: ${error}`, "error");
            adapterSection.removeChild(spinner);
            console.error('Error:', error)
        });
}


export function stopFFmpeg(adapterId) {
    const adapterSection = document.getElementById(`adapter-${adapterId}`);
    adapterSection.style.position = 'relative';

    // Add a spinner to indicate loading
    const spinner = document.createElement('div');
    spinner.className = 'spinner-overlay';
    spinner.innerHTML = `<div class="loading-spinner"></div>`;
    adapterSection.appendChild(spinner);

    fetch(`/adapters/${adapterId}/stop`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            adapterSection.removeChild(spinner);
            showPopup(data.msg, data.status);
            updateAdapters(adapterId)
        })
        .catch(error => {
            adapterSection.removeChild(spinner);
            showPopup(error, "error")
        });
}

export function deleteAdapter(adapterId) {
    fetch(`/adapters/${adapterId}/`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            showPopup(data.msg, data.status);
            updateAdapters();
        })
        .catch(error => showPopup(error, "error"));
}

export function toggleMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}