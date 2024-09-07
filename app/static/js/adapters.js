import {
    startFFmpeg,
    stopFFmpeg,
    scanAdapter,
    deleteAdapter,
    toggleMenu,
    stopAllffmpegs
} from './modules/a_controlls.js';
// import { showNewAdapterForm } from './modules/a_form.js';

document.addEventListener('DOMContentLoaded', function () {
    updateAdapters();
    document.getElementById('stop-all-ffmpegs').addEventListener('click', stopAllffmpegs);
    document.getElementById('existing-adapters').addEventListener('click', function (event) {
        const target = event.target;
        const adapterId = target.getAttribute('data-adapter-id');

        if (target.classList.contains('start-ffmpeg')) {
            startFFmpeg(adapterId);
        } else if (target.classList.contains('stop-ffmpeg')) {
            stopFFmpeg(adapterId);
        } else if (target.classList.contains('scan-adapter')) {
            scanAdapter(adapterId);
        } else if (target.classList.contains('delete-adapter')) {
            deleteAdapter(adapterId);
        } else if (target.classList.contains('menu-button')) {
            const menuId = target.getAttribute('data-menu-id');
            toggleMenu(menuId);
        }
    });
});

function addEventListeners() {
    document.getElementById('stop-all-ffmpegs').addEventListener('click', stopAllffmpegs);
    // document.getElementById('new-adapter-form').addEventListener('click', showNewAdapterForm);


    // Add event listeners for start buttons
    document.querySelectorAll('.start-ffmpeg').forEach(button => {
        button.addEventListener('click', function () {
            const adapterId = this.getAttribute('data-adapter-id');
            startFFmpeg(adapterId);
        });
    });

    // Add event listeners for stop buttons
    document.querySelectorAll('.stop-ffmpeg').forEach(button => {
        button.addEventListener('click', function () {
            const adapterId = this.getAttribute('data-adapter-id');
            stopFFmpeg(adapterId);
        });
    });

    // Add event listeners for scan buttons
    document.querySelectorAll('.scan-adapter').forEach(button => {
        button.addEventListener('click', function () {
            const adapterId = this.getAttribute('data-adapter-id');
            scanAdapter(adapterId);
        });
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-adapter').forEach(button => {
        button.addEventListener('click', function () {
            const adapterId = this.getAttribute('data-adapter-id');
            deleteAdapter(adapterId);
        });
    });

    // Add event listeners for menu buttons
    document.querySelectorAll('.menu-button').forEach(button => {
        button.addEventListener('click', function () {
            const menuId = this.getAttribute('data-menu-id');
            toggleMenu(menuId);
        });
    });
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

    console.log(`SELECTED: \n${selectedChannels}`)
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
export function updateAdapters(adapterId = null) {
    const url = adapterId ? `/get_adapter/${adapterId}/` : '/get_adapters/';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (adapterId) {
                updateAdapterDiv(adapterId, data);
            } else {
                const adapterContainer = document.getElementById('existing-adapters');
                adapterContainer.innerHTML = ''; // Clear the container

                Object.entries(data).forEach(([id, adapter]) => {
                    updateAdapterDiv(id, adapter);
                });
            }
            //addEventListeners();
        })
        .catch(error => showPopup(error, "error"));
}

function toggleProgramDetails(programTitle) {
    const detailsDiv = document.getElementById(`program-details-${programTitle}`);
    if (detailsDiv.style.display === "none") {
        detailsDiv.style.display = "block";
    } else {
        detailsDiv.style.display = "none";
    }
}

function toggleUrlList(urlListId) {
    const urlList = document.getElementById(urlListId);
    if (urlList.style.display === "none") {
        urlList.style.display = "block";
    } else {
        urlList.style.display = "none";
    }
}

function updateAdapterDiv(adapterId, adapter) {
    const adapterDiv = document.getElementById(`adapter-${adapterId}`) || document.createElement('div');
    adapterDiv.id = `adapter-${adapterId}`;
    adapterDiv.style.position = 'relative';

    // Display selected channels
    const selectedPrograms = adapter.programs ?
        Object.entries(adapter.programs)
        .filter(([_, program]) => program.selected)
        .map(([_, program]) => program) : [];

    const status = adapter.running ? '<span style="color: green;">Running</span>' : '<span style="color: red;">Stopped</span>';

    const selectedChannelsHtml = selectedPrograms.length ?
        selectedPrograms.map(program => `
            <li>
                <a href="javascript:void(0);" onclick="toggleProgramDetails('${program.title}-${adapterId}')">
                    ${program.title}
                </a>
                <div id="program-details-${program.title}-${adapterId}" class="program-details" style="display:none; margin-left: 20px;">
                    <div class="video-stream"><strong>Video:</strong> 
                        ${program.streams.video
                            .filter(v => v.selected)
                            .map(v => `${v.codec}`).join(', ')
                        }
                    </div>
                    <div class="audio-stream"><strong>Audio:</strong> 
                        ${program.streams.audio
                            .filter(a => a.selected)
                            .map(a => `${a.codec}`).join(', ')
                        }
                    </div>
                    ${program.streams.subtitle.some(s => s.selected) ? `
                    <div class="subtitle-stream"><strong>Subtitle:</strong> 
                        ${program.streams.subtitle
                            .filter(s => s.selected)
                            .map(s => `${s.codec}`).join(', ')
                        }
                    </div>
                    ` : ''}
                </div>
            </li>
        `).join('') : '<li>None</li>';

    // Adapter type and UDP URLs (with Expand/Collapse for SPTS)
    const udpUrlsHtml = adapter.type === 'SPTS' ? `
        <div>
            <a href="javascript:void(0);" onclick="toggleUrlList('${adapterId}-urls')">UDP URLs: &#11206;</a>
            <ul id="${adapterId}-urls" style="display:none;">
                ${adapter.udp_urls.map(urlConfig => `
                    <li>
                        ${urlConfig.udp_url}${urlConfig.astra_stream_id ? ` (Astra ID: ${urlConfig.astra_stream_id})` : ''}
                    </li>
                `).join('')}
            </ul>
        </div>` : `
        <div id="udp-url">
            UDP link: ${adapter.udp_urls.map(urlConfig => `
                ${urlConfig.udp_url}${urlConfig.astra_stream_id ? ` (Astra ID: ${urlConfig.astra_stream_id})` : ''}
            `).join(', ')}
        </div>`;

    adapterDiv.innerHTML = `
        <h3>${adapter.adapter_name}: (Adapter${adapter.adapter_number}/mod${adapter.modulator_number}) ${status}</h3>
        <div><strong>Type:</strong> ${adapter.type.toUpperCase()}</div>
        ${udpUrlsHtml}
        <div id="udp-url">Frequency: ${adapter.description}</div>
        <div class="selected-channels">
            <p>Selected channels:</p>
            <ul id="selected-channels-list">
                ${selectedChannelsHtml}
            </ul>
        </div>
        <div id="scan-section-${adapterId}">
            <!-- Scan results will be loaded here -->
        </div>
        
        <!-- Duplicate Start/Stop buttons for faster control -->
        <div class="adapter-control-buttons">
            <button class="start-ffmpeg" data-adapter-id="${adapterId}" ${adapter.running ? 'disabled' : ''}>Start</button>
            <button class="stop-ffmpeg" data-adapter-id="${adapterId}" ${adapter.running ? '' : 'disabled'}>Stop</button>
        </div>
        <!-- Menu with dropdown -->
        <div class="adapter-menu">
            <div class="menu-button" data-menu-id="${adapterId}-menu">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <div id="${adapterId}-menu" class="menu-dropdown" style="display: none;">
                <button class="scan-adapter" data-adapter-id="${adapterId}">Scan</button>
                <button class="start-ffmpeg" data-adapter-id="${adapterId}" ${adapter.running ? 'disabled' : ''}>Start</button>
                <button class="stop-ffmpeg" data-adapter-id="${adapterId}" ${adapter.running ? '' : 'disabled'}>Stop</button>
                <button class="delete-adapter" data-adapter-id="${adapterId}">Delete</button>
            </div>
        </div>
    `;

    if (!document.getElementById(`adapter-${adapterId}`)) {
        document.getElementById('existing-adapters').appendChild(adapterDiv);
    }
}