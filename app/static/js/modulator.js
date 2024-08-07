// modulator.js
let adapterData;
let numMods = 0; // This will be dynamically set based on the selected adapter's mods

// Fetch the list of adapters and their modulators from the backend
async function fetchAdaptersAndModulators() {
    const response = await fetch('/modulator/data');
    return await response.json();
}

// Fetch the existing configuration for a specific adapter
async function fetchModulatorConfig(adapterId) {
    const response = await fetch(`/api/modulator_config/${adapterId}`);
    return await response.json();
}

// Fetch and set the number of mods for the selected adapter
function fetchNumMods(adapterId) {
    fetch(`/api/modulator_config/${adapterId}`)
        .then(response => response.json())
        .then(data => {
            numMods = data.streams.length;
            updateStreamAssignments(adapterId);
        })
        .catch(error => console.error('Error fetching mods:', error));
}

// Initialize the page by loading the adapters and setting up event handlers
async function init() {
    adapterData = await fetchAdaptersAndModulators();
    displayAdapters(adapterData);
}

// Display the list of adapters as dropdown buttons
function displayAdapters(adapterData) {
    const adapterList = document.getElementById('adapter-list');
    adapterList.innerHTML = ''; // Clear any existing content

    Object.keys(adapterData).forEach(adapterId => {
        // Create dropdown button for the adapter
        const adapterButton = document.createElement('button');
        adapterButton.className = 'adapter-button';
        adapterButton.textContent = `Adapter ${adapterId}`;
        adapterButton.onclick = () => toggleAdapterSettings(adapterId);

        // Create div to hold adapter settings, initially collapsed
        const adapterSettings = document.createElement('div');
        adapterSettings.className = 'adapter-settings';
        adapterSettings.id = `adapter-settings-${adapterId}`;
        adapterSettings.style.display = 'none';

        adapterList.appendChild(adapterButton);
        adapterList.appendChild(adapterSettings);
    });
}

// Toggle the display of settings for a selected adapter
async function toggleAdapterSettings(adapterId) {
    // Collapse other adapter settings
    document.querySelectorAll('.adapter-settings').forEach(settingsDiv => {
        if (settingsDiv.id !== `adapter-settings-${adapterId}`) {
            settingsDiv.style.display = 'none';
        }
    });

    const adapterSettings = document.getElementById(`adapter-settings-${adapterId}`);
    if (adapterSettings.style.display === 'none') {
        const config = await fetchModulatorConfig(adapterId);
        populateAdapterSettings(adapterId, adapterSettings, config);
        adapterSettings.style.display = 'block';
    } else {
        adapterSettings.style.display = 'none';
    }
}

// Populate settings form for the selected adapter
function populateAdapterSettings(adapterId, adapterSettingsDiv, config) {
    adapterSettingsDiv.innerHTML = `
        <h2>Settings for Adapter ${adapterId}</h2>
        <form id="modulator-form-${adapterId}">
            <div>
                <label for="connector-${adapterId}">Connector</label>
                <select id="connector-${adapterId}" name="connector">
                    <option value="OFF" ${config.connector === 'OFF' ? 'selected' : ''}>OFF</option>
                    <option value="SMA" ${config.connector === 'SMA' ? 'selected' : ''}>SMA</option>
                    <option value="F" ${config.connector === 'F' ? 'selected' : ''}>F</option>
                </select>
            </div>
            <div>
                <label for="channels-${adapterId}">Channels</label>
                <input type="number" id="channels-${adapterId}" name="channels" min="1" max="50" value="${config.channels}">
            </div>
            <div>
                <label for="power-${adapterId}">Modulator Power (DBUV)</label>
                <input type="number" id="power-${adapterId}" name="power" min="0" max="150" step="1" value="${config.power}">
            </div>
            <div>
                <label for="frequency-${adapterId}">Base Frequency (MHz)</label>
                <input type="number" id="frequency-${adapterId}" name="frequency" min="114" max="900" step="8" value="${config.frequency}">
            </div>
            <div>
                <label for="standard-${adapterId}">Standard</label>
                <select id="standard-${adapterId}" name="standard">
                    <option value="DVBT_8" ${config.standard === 'DVBT_8' ? 'selected' : ''}>DVB-T 8MHz</option>
                    <option value="DVBT_7" ${config.standard === 'DVBT_7' ? 'selected' : ''}>DVB-T 7MHz</option>
                    <option value="DVBT_6" ${config.standard === 'DVBT_6' ? 'selected' : ''}>DVB-T 6MHz</option>
                </select>
            </div>
            <h2>Stream Assignments</h2>
            <div id="stream-assignments-${adapterId}">
                ${populateStreamAssignments(adapterId, config.streams)}
            </div>
            <button type="button" onclick="saveConfig(${adapterId})">Save</button>
        </form>
    `;

    // Add event listeners for frequency, channels, and standard inputs
    const frequencyInput = document.getElementById(`frequency-${adapterId}`);
    const channelsInput = document.getElementById(`channels-${adapterId}`);
    const standardInput = document.getElementById(`standard-${adapterId}`);

    if (frequencyInput && channelsInput && standardInput) {
        frequencyInput.addEventListener('input', () => updateStreamAssignments(adapterId));
        channelsInput.addEventListener('input', () => updateStreamAssignments(adapterId));
        standardInput.addEventListener('change', () => updateStreamAssignments(adapterId));
    } else {
        console.error('Error: Required inputs are missing during event listener setup.');
    }

    fetchNumMods(adapterId); // Fetch the number of mods
}

// Populate the stream assignments for the given streams
function populateStreamAssignments(adapterId, streams) {
    let assignmentsHTML = '';
    const streamAssignmentsDiv = document.getElementById(`stream-assignments-${adapterId}`);

    const frequencyInput = document.getElementById(`frequency-${adapterId}`);
    const channelsInput = document.getElementById(`channels-${adapterId}`);
    const standardInput = document.getElementById(`standard-${adapterId}`);

    if (!frequencyInput || !channelsInput || !standardInput) {
        console.error('One or more input elements are missing.');
        console.log('Frequency Input:', frequencyInput);
        console.log('Channels Input:', channelsInput);
        console.log('Standard Input:', standardInput);
        return;
    }

    const baseFrequency = parseFloat(frequencyInput.value);
    const numberOfChannels = parseInt(channelsInput.value);
    const standard = standardInput.value;
    let channelSpacing = 8; // Default for DVB-T 8MHz

    if (standard === "DVBT_7") {
        channelSpacing = 7;
    } else if (standard === "DVBT_6") {
        channelSpacing = 6;
    }

    for (let i = 0; i < numberOfChannels; i++) {
        const channelFrequency = baseFrequency + i * channelSpacing;
        const streamAssignment = document.createElement('div');
        streamAssignment.classList.add('stream-assignment');

        let optionsHtml = `<option value="">None</option>`;
        for (let j = 0; j < numMods; j++) {
            optionsHtml += `<option value="${j}" ${streams[i] === `mod${j}` ? 'selected' : ''}>mod ${j}</option>`;
        }

        streamAssignment.innerHTML = `
            <label>Slot ${i} (${channelFrequency.toFixed(1)} MHz)</label>
            <select name="stream[${i}]" data-channel="${i}">
                ${optionsHtml}
            </select>
        `;

        assignmentsHTML += streamAssignment.outerHTML;
    }

    streamAssignmentsDiv.innerHTML = assignmentsHTML;
}

// Update the stream assignments when frequency, channels, or standard change
function updateStreamAssignments(adapterId) {
    const form = document.getElementById(`modulator-form-${adapterId}`);
    const formData = new FormData(form);
    const streams = Array.from(form.querySelectorAll('select[name^="stream"]')).map(select => select.value);
    populateStreamAssignments(adapterId, streams);
}

// Save the configuration for the currently displayed adapter
async function saveConfig(adapterId) {
    const form = document.getElementById(`modulator-form-${adapterId}`);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Gather the channel and stream assignments
    data.streamAssignments = Array.from(form.querySelectorAll('select[name^="stream"]')).reduce((acc, select, index) => {
        acc[`channel${index}`] = select.dataset.channel; // Use data-channel attribute for channel index
        acc[`stream${index}`] = select.value;
        return acc;
    }, {});

    try {
        const response = await fetch(`/api/save_modulator_config/${adapterId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Configuration saved successfully!');
        } else {
            alert('Failed to save configuration.');
        }
    } catch (error) {
        console.error('Error saving configuration:', error);
        alert('Failed to save configuration.');
    }
}

// Initialize the page on load
document.addEventListener('DOMContentLoaded', init);