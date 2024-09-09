import {
    showPopup
} from '../utils/popup.js';
import {
    updateAdapters
} from '../../adapters.js';

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
                toggleMenu(adapterId+"-menu")
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

function setAdapterControlDisplay(id, isDisplay) {
    const adapterDiv = document.getElementById(`adapter-${id}`);
    adapterDiv.querySelector(`#scan-button-${id}`).style.display = isDisplay ? 'inline' : 'none';
    adapterDiv.querySelector(`#start-form-${id}`).style.display = isDisplay ? 'inline' : 'none';
    adapterDiv.querySelector(`#stop-form-${id}`).style.display = isDisplay ? 'inline' : 'none';
    adapterDiv.querySelector(`#delete-form-${id}`).style.display = isDisplay ? 'inline' : 'none';
}

function cancelSelection(adapterId) {
    const scanSection = document.getElementById(`scan-section-${adapterId}`);
    // Restore other controls
    setAdapterControlDisplay(adapterId, true);
    // Clear scan results
    scanSection.innerHTML = '';
}

function updateChannelSelection(programId) {
    const channelCheckbox = document.getElementById(`channel-${programId}`);
    const streamCheckboxes = document.querySelectorAll(`[data-channel="${programId}"]`);

    // Set all stream checkboxes based on channel checkbox state
    streamCheckboxes.forEach(cb => cb.checked = channelCheckbox.checked);
}

function updateStreamSelection(programId) {
    const channelCheckbox = document.getElementById(`channel-${programId}`);
    const streamCheckboxes = document.querySelectorAll(`[data-channel="${programId}"]`);

    // Update the channel checkbox based on the stream checkboxes
    const allStreamsSelected = Array.from(streamCheckboxes).every(cb => cb.checked);
    const anyStreamSelected = Array.from(streamCheckboxes).some(cb => cb.checked);

    if (allStreamsSelected) {
        channelCheckbox.checked = true;
    } else if (!anyStreamSelected) {
        channelCheckbox.checked = false;
    }
}

function toggleChannel(event, programId) {
    event.preventDefault(); // Prevent default behavior of the label
    const channelCheckbox = document.getElementById(`channel-${programId}`);
    channelCheckbox.checked = !channelCheckbox.checked;
    updateChannelSelection(programId);
}

function toggleStream(event, streamId) {
    event.preventDefault(); // Prevent default behavior of the label
    const streamCheckbox = document.getElementById(`video-${streamId}`) || document.getElementById(`audio-${streamId}`) || document.getElementById(`subtitle-${streamId}`);
    streamCheckbox.checked = !streamCheckbox.checked;
    const channelId = streamCheckbox.getAttribute('data-channel');
    updateStreamSelection(channelId);
}


function saveSelection(adapterId) {
    const selectedChannels = {};

    // Collect selected streams
    const streamCheckboxes = document.querySelectorAll('input[type="checkbox"][data-id]');
    streamCheckboxes.forEach(cb => {
        if (cb.checked) {
            const streamId = cb.dataset.id;
            if (!cb.dataset.channel)
                return;
            const channelId = cb.dataset.channel;
            if (!selectedChannels[channelId]) {
                selectedChannels[channelId] = {
                    video: [],
                    audio: [],
                    subtitle: []
                };
            }
            if (cb.id.startsWith('video-')) {
                selectedChannels[channelId].video.push(streamId);
            } else if (cb.id.startsWith('audio-')) {
                selectedChannels[channelId].audio.push(streamId);
            } else if (cb.id.startsWith('subtitle-')) {
                selectedChannels[channelId].subtitle.push(streamId);
            }
        }
    });

    fetch(`/adapters/${adapterId}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                channels: selectedChannels
            })
        })
        .then(response => response.json())
        .then(data => {
            showPopup(data.msg, data.status);
            updateAdapters(adapterId)
        })
        .catch(error => showPopup(error, "error"));
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
