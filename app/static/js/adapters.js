document.addEventListener('DOMContentLoaded', function () {
    loadAdapters();
});

function stopAllffmpegs() {
    fetch('/adapters/stop_all')
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadAdapters(); // Reload the adapters list
        });
}

function showNewAdapterForm() {
    document.getElementById('new-adapter-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    fetchAvailableAdapters(); // Call this function when the modal is shown
}

function hideNewAdapterForm() {
    document.getElementById('new-adapter-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
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
            loadAdapters(); // Reload the adapters list
        })
        .catch(error => console.error('Error:', error));
}

function scanAdapter(adapterId) {
    fetch(`/adapters/${adapterId}/scan`)
        .then(response => response.json())
        .then(data => {
            const programs = data.programs;
            const scanSection = document.getElementById(`scan-section-${adapterId}`);
            const adapterDiv = document.getElementById(`adapter-${adapterId}`);

            // Hide other controls
            adapterDiv.querySelector(`#scan-button-${adapterId}`).style.display = 'none';
            adapterDiv.querySelector(`#start-form-${adapterId}`).style.display = 'none';
            adapterDiv.querySelector(`#stop-form-${adapterId}`).style.display = 'none';
            adapterDiv.querySelector(`#delete-form-${adapterId}`).style.display = 'none';

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
                            </ul>
                        </li>
                    `).join('')}
                </ul>
                <button onclick="saveSelection(${adapterId})">Save Selected</button>
                <button onclick="cancelSelection(${adapterId})">Cancel</button>
            `;
        })
        .catch(error => console.error('Error:', error));
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
    const streamCheckbox = document.getElementById(`video-${streamId}`) || document.getElementById(`audio-${streamId}`);
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
                    audio: []
                };
            }
            if (cb.id.startsWith('video-')) {
                selectedChannels[channelId].video.push(streamId);
            } else if (cb.id.startsWith('audio-')) {
                selectedChannels[channelId].audio.push(streamId);
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
            alert(data.message);
            loadAdapters(); // Reload the adapters list
        })
        .catch(error => console.error('Error:', error));
}

function cancelSelection(adapterId) {
    const scanSection = document.getElementById(`scan-section-${adapterId}`);
    const adapterDiv = document.getElementById(`adapter-${adapterId}`);

    // Restore other controls
    adapterDiv.querySelector(`#scan-button-${adapterId}`).style.display = 'inline';
    adapterDiv.querySelector(`#start-form-${adapterId}`).style.display = 'inline';
    adapterDiv.querySelector(`#stop-form-${adapterId}`).style.display = 'inline';
    adapterDiv.querySelector(`#delete-form-${adapterId}`).style.display = 'inline';

    // Clear scan results
    scanSection.innerHTML = '';
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
            loadAdapters(); // Reload the adapters list
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
            loadAdapters(); // Reload the adapters list
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
            loadAdapters(); // Reload the adapters list
        })
        .catch(error => console.error('Error:', error));
}


function loadAdapters() {
    fetch('/get_adapters/')
        .then(response => response.json())
        .then(data => {
            const adapterContainer = document.getElementById('existing-adapters');
            adapterContainer.innerHTML = ''; // Clear the container

            Object.entries(data).forEach(([adapterId, adapter]) => {
                const adapterDiv = document.createElement('div');
                adapterDiv.id = `adapter-${adapterId}`;

                // Display selected channels
                const selectedPrograms = adapter.programs ?
                    Object.entries(adapter.programs)
                    .filter(([_, program]) => program.selected)
                    .map(([_, program]) => program) : [];

                const status = adapter.running ? '<span style="color: green;">Running</span>' : '<span style="color: red;">Stopped</span>';

                const selectedChannelsHtml = selectedPrograms.length ? 
                    selectedPrograms.map(program => `
                        <li>
                            <a href="javascript:void(0);" onclick="toggleProgramDetails('${program.title}')">
                                ${program.title}
                            </a>
                            <div id="program-details-${program.title}" class="program-details" style="display:none; margin-left: 20px;">
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
                            </div>
                        </li>
                    `).join('') : '<li>None</li>';

                adapterDiv.innerHTML = `
                <h3>Adapter ${adapterId}: (Adapter${adapter.adapter_number}/mod${adapter.modulator_number})  ${status}</h3>
                <div id="udp-url">UDP link: ${adapter.udp_url}</div>
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
                <button onclick="scanAdapter(${adapterId})" id="scan-button-${adapterId}" ${adapter.running ? 'disabled' : ''}>Scan</button>
                <form method="post" action="/adapters/${adapterId}/start" id="start-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="startFFmpeg(${adapterId})" ${adapter.running ? 'disabled' : ''}>Start</button>
                </form>
                <form method="post" action="/adapters/${adapterId}/stop" id="stop-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="stopFFmpeg(${adapterId})" ${adapter.running ? '' : 'disabled'}>Stop</button>
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

function toggleProgramDetails(programTitle) {
    const detailsDiv = document.getElementById(`program-details-${programTitle}`);
    if (detailsDiv.style.display === "none") {
        detailsDiv.style.display = "block";
    } else {
        detailsDiv.style.display = "none";
    }
}



// function loadAdapters() {
//     fetch('/get_adapters/')
//         .then(response => response.json())
//         .then(data => {
//             const adapterContainer = document.getElementById('existing-adapters');
//             adapterContainer.innerHTML = ''; // Clear the container

//             Object.entries(data).forEach(([adapterId, adapter]) => {
//                 const adapterDiv = document.createElement('div');
//                 adapterDiv.id = `adapter-${adapterId}`;

//                 // Display selected channels
//                 const selectedPrograms = adapter.programs ?
//                     Object.values(adapter.programs)
//                     .filter(program => program.selected)
//                     .map(program => program.title) : [];

//                 const status = adapter.running ? '<span style="color: green;">Running</span>' : '<span style="color: red;">Stopped</span>';

//                 adapterDiv.innerHTML = `
//                 <h3>Adapter ${adapterId}: (Adapter${adapter.adapter_number}/mod${adapter.modulator_number})  ${status}</h3>
//                 <div id="udp-url">UDP link: ${adapter.udp_url}</div>
//                 <div id="udp-url">Frequency: ${adapter.description}</div>
//                 <div class="selected-channels">
//                     <p>Selected channels:</p>
//                     <ul id="selected-channels-list">
//                         ${selectedPrograms.length ? selectedPrograms.map(program => `<li>${program}</li>`).join('') : '<li>None</li>'}
//                     </ul>
//                 </div>
//                 <div id="scan-section-${adapterId}">
//                     <!-- Scan results will be loaded here -->
//                 </div>
//                 <button onclick="scanAdapter(${adapterId})" id="scan-button-${adapterId}" ${adapter.running ? 'disabled' : ''}>Scan</button>
//                 <form method="post" action="/adapters/${adapterId}/start" id="start-form-${adapterId}" style="display:inline;">
//                     <button type="button" onclick="startFFmpeg(${adapterId})" ${adapter.running ? 'disabled' : ''}>Start</button>
//                 </form>
//                 <form method="post" action="/adapters/${adapterId}/stop" id="stop-form-${adapterId}" style="display:inline;">
//                     <button type="button" onclick="stopFFmpeg(${adapterId})" ${adapter.running ? '' : 'disabled'}>Stop</button>
//                 </form>
//                 <form method="post" action="/adapters/${adapterId}/delete" id="delete-form-${adapterId}" style="display:inline;">
//                     <button type="button" onclick="deleteAdapter(${adapterId})">Delete</button>
//                 </form>
//             `;
//                 adapterContainer.appendChild(adapterDiv);
//             });
//         })
//         .catch(error => console.error('Error:', error));
// }


function fetchAvailableAdapters() {
    console.log('Fetching available adapters');
    fetch('/adapters/available')
        .then(response => response.json())
        .then(data => {
            const adapterSelect = document.getElementById('adapter-number');
            const modulatorSelect = document.getElementById('modulator-number');

            // Clear existing options
            adapterSelect.innerHTML = '';
            modulatorSelect.innerHTML = '';

            // Populate adapter numbers
            data.adapters.forEach(adapter => {
                const option = document.createElement('option');
                option.value = adapter;
                option.text = adapter;
                adapterSelect.add(option);
            });

            // Populate modulator numbers
            data.modulators.forEach(modulator => {
                const option = document.createElement('option');
                option.value = modulator;
                option.text = modulator;
                modulatorSelect.add(option);
            });
        })
        .catch(error => console.error('Error fetching available adapters:', error));
}

// Call fetchAvailableAdapters when the modal is opened
//document.getElementById('new-adapter-modal').addEventListener('show', fetchAvailableAdapters);