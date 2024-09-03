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
    resetNewAdapterForm()
}


function toggleUrlInputs() {
    const urlType = document.getElementById("url-type").value;
    const urlContainer = document.getElementById("url-input-container");

    if (urlType === "spts") {
        urlContainer.innerHTML = `
            <div id="url-input-1" class="url-input-wrapper">
                <label for="udp-url-1">UDP URL 1:</label>
                <input type="text" id="udp-url-1" name="udp-url" class="udp-url-input" required><br>
            </div>
            <div id="add-new-spts-url">
                <button type="button" onclick="addUrlInput()">Add SPTS URL</button>
            </div>
        `;
    } else {
        urlContainer.innerHTML = `
            <label for="udp-url">UDP URL:</label>
            <input type="text" id="udp-url" name="udp-url" class="udp-url-input" required><br>
        `;
    }
}


function addUrlInput() {
    const urlContainer = document.getElementById("url-input-container");
    const inputCount = urlContainer.querySelectorAll('input[type="text"]').length;

    const newInput = document.createElement("div");
    newInput.setAttribute("id", `url-input-${inputCount + 1}`);
    newInput.classList.add("url-input-wrapper");
    newInput.innerHTML = `
        <label for="udp-url-${inputCount + 1}">UDP URL ${inputCount + 1}:</label>
        <input type="text" id="udp-url-${inputCount + 1}" name="udp-url" class="udp-url-input" required>
        <button type="button" onclick="removeUrlInput(${inputCount + 1})" class="remove-url-button">-</button><br>
    `;
    urlContainer.insertBefore(newInput, document.getElementById("add-new-spts-url"));
}


function removeUrlInput(index) {
    const urlInput = document.getElementById(`url-input-${index}`);
    urlInput.remove();
}

function handleFormSubmit(event) {
    event.preventDefault();
    const urlType = document.getElementById("url-type").value;

    if (urlType === "mpts") {
        createSingleUrlAdapter(event);
    } else if (urlType === "spts") {
        createMultiUrlAdapter(event);
    }
}


function createSingleUrlAdapter(event) {
    //logic for handling a single MPTS URL adapter
    event.preventDefault();
    const adapterNumber = document.getElementById('adapter-number').value;
    const modulatorNumber = document.getElementById('modulator-number').value;
    const adapterName = document.getElementById('adapter-name').value;
    const udpUrl = document.getElementById('udp-url').value;

    fetch('/adapters/createMA', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adapter_number: parseInt(adapterNumber),
                modulator_number: parseInt(modulatorNumber),
                type: 'MPTS', // Specify the type as MPTS
                adapter_name: adapterName,
                udp_urls: [udpUrl] // Send a single URL as an array
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

function createMultiUrlAdapter(event) {
    event.preventDefault();
    const adapterNumber = document.getElementById('adapter-number').value;
    const modulatorNumber = document.getElementById('modulator-number').value;
    const adapterName = document.getElementById('adapter-name').value;
    const urlInputs = document.querySelectorAll('.udp-url-input');
    const udpUrls = [];

    urlInputs.forEach(input => {
        if (input.value.trim() !== "") {
            udpUrls.push(input.value.trim());
        }
    });

    // Check for duplicate URLs
    const duplicateUrls = udpUrls.filter((url, index) => udpUrls.indexOf(url) !== index);
    if (duplicateUrls.length > 0) {
        alert('Duplicate URLs found: ' + duplicateUrls.join(', ') + '. Please ensure all URLs are unique.');
        return;
    }

    fetch('/adapters/createSA', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                adapter_number: parseInt(adapterNumber),
                modulator_number: parseInt(modulatorNumber),
                type: 'SPTS', // Specify the type as SPTS
                adapter_name: adapterName,
                udp_urls: udpUrls // Send the list of URLs
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

function resetNewAdapterForm() {
    // Reset the form
    document.getElementById('adapter-form').reset();

    // Clear any dynamically added URL input fields if needed
    const urlInputContainer = document.getElementById('url-input-container');
    urlInputContainer.innerHTML = `
            <label for="udp-url">UDP URL:</label>
            <input type="text" id="udp-url" name="udp-url" class="udp-url-input" required><br>
        `;
    // Reset the URL Type to the default value (optional)
    document.getElementById('url-type').value = 'mpts';
}

function scanAdapter(adapterId) {
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
            alert("Scan Error. See log file.")
            updateAdapter(adapterId)
            scanSection.removeChild(spinner);
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
            alert(data.msg);
            updateAdapter(adapterId)
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
            if (data.status == "success") {
                alert(data.msg);
                updateAdapter(adapterId)
            } else if (data.status == "error") {
                alert(data.msg);
                updateAdapter(adapterId)
            }
        })
        .catch(error => {
            alert(`Start Adapter Error: ${error}`);
            adapterSection.removeChild(spinner);
            console.error('Error:', error)
        });
}

function stopFFmpeg(adapterId) {
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
            if (data.status == "success") {
                alert(data.msg);
                updateAdapter(adapterId)
            } else if (data.status == "error") {
                alert(data.msg);
                updateAdapter(adapterId)
            }
        })
        .catch(error => {
            adapterSection.removeChild(spinner);
            console.error('Error:', error)
        });
}

function deleteAdapter(adapterId) {
    fetch(`/adapters/${adapterId}/`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.status == "success") {
                alert(data.msg);
                loadAdapters();
            } else if (data.status == "error") {
                alert(data.msg);
                updateAdapter(adapterId);
            }
        })
        .catch(error => console.error('Error:', error));
}


function updateAdapter(adapterId) {
    fetch(`/get_adapter/${adapterId}/`)
        .then(response => response.json())
        .then(adapter => {
            const adapterDiv = document.getElementById(`adapter-${adapterId}`);
            if (!adapterDiv) {
                console.error(`Adapter with ID ${adapterId} not found.`);
                return;
            }

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
                    <a href="javascript:void(0);" onclick="toggleUrlList('${adapterId}-urls')">UDP URLs:  &#11206;</a>
                    <ul id="${adapterId}-urls" style="display:none;">
                        ${adapter.udp_urls.map(url => `<li>${url}</li>`).join('')}
                    </ul>
                </div>` : `<div id="udp-url">UDP link: ${adapter.udp_urls}</div>`;

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
                <button onclick="scanAdapter('${adapterId}')" id="scan-button-${adapterId}" ${adapter.running ? 'disabled' : ''}>Scan</button>
                <form method="post" action="/adapters/${adapterId}/start" id="start-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="startFFmpeg('${adapterId}')" ${adapter.running ? 'disabled' : ''}>Start</button>
                </form>
                <form method="post" action="/adapters/${adapterId}/stop" id="stop-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="stopFFmpeg('${adapterId}')" ${adapter.running ? '' : 'disabled'}>Stop</button>
                </form>
                <form method="post" action="/adapters/${adapterId}/delete" id="delete-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="deleteAdapter('${adapterId}')">Delete</button>
                </form>
            `;
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
                        <a href="javascript:void(0);" onclick="toggleUrlList('${adapterId}-urls')">UDP URLs:  &#11206;</a>
                        <ul id="${adapterId}-urls" style="display:none;">
                            ${adapter.udp_urls.map(url => `<li>${url}</li>`).join('')}
                        </ul>
                    </div>` : `<div id="udp-url">UDP link: ${adapter.udp_urls}</div>`;

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
                <button onclick="scanAdapter('${adapterId}')" id="scan-button-${adapterId}" ${adapter.running ? 'disabled' : ''}>Scan</button>
                <form method="post" action="/adapters/${adapterId}/start" id="start-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="startFFmpeg('${adapterId}')" ${adapter.running ? 'disabled' : ''}>Start</button>
                </form>
                <form method="post" action="/adapters/${adapterId}/stop" id="stop-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="stopFFmpeg('${adapterId}')" ${adapter.running ? '' : 'disabled'}>Stop</button>
                </form>
                <form method="post" action="/adapters/${adapterId}/delete" id="delete-form-${adapterId}" style="display:inline;">
                    <button type="button" onclick="deleteAdapter('${adapterId}')">Delete</button>
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

function toggleUrlList(urlListId) {
    const urlList = document.getElementById(urlListId);
    if (urlList.style.display === "none") {
        urlList.style.display = "block";
    } else {
        urlList.style.display = "none";
    }
}



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
