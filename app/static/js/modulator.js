// modulator.js
let adapterData;
let streams;

// Fetch the list of adapters and their modulators from the backend
async function fetchAdaptersAndModulators() {
    const response = await fetch('/modulator/data');
    return await response.json();
}

// Fetch the existing configuration for a specific adapter
async function fetchModulatorConfig(adapterId) {
    const response = await fetch(`/modulator_config/${adapterId}`);
    return await response.json();
}

// Initialize the page by loading the adapters and setting up event handlers
async function init() {
    adapterData = await fetchAdaptersAndModulators();
    displayAdapters(adapterData);
}

// Display the list of adapters as dropdown buttons
function displayAdapters(adapterData) {
    const adapterList = document.getElementById('modulator-list');
    adapterList.innerHTML = ''; // Clear any existing content

    Object.keys(adapterData).forEach(adapterId => {
        // Create dropdown button for the adapter
        const adapterButton = document.createElement('button');
        adapterButton.className = 'modulator-button';
        adapterButton.textContent = `Modulator Adapter ${adapterId}`;
        adapterButton.onclick = () => toggleAdapterSettings(adapterId);

        // Create div to hold adapter settings, initially collapsed
        const adapterSettings = document.createElement('div');
        adapterSettings.className = 'modulator-settings';
        adapterSettings.id = `modulator-settings-${adapterId}`;
        adapterSettings.style.display = 'none';

        adapterList.appendChild(adapterButton);
        adapterList.appendChild(adapterSettings);
    });
}

// Toggle the display of settings for a selected adapter
async function toggleAdapterSettings(adapterId) {
    // Collapse other adapter settings
    document.querySelectorAll('.modulator-settings').forEach(settingsDiv => {
        if (settingsDiv.id !== `modulator-settings-${adapterId}`) {
            settingsDiv.style.display = 'none';
        }
    });

    const adapterSettingsContainer = document.getElementById('modulator-settings-container');

    const adapterSettings = document.getElementById(`modulator-settings-${adapterId}`);
    if (adapterSettings.style.display === 'none') {
        adapterSettingsContainer.innerHTML = ''; // Clear any existing content
        const config = await fetchModulatorConfig(adapterId);
        populateAdapterSettings(adapterId, adapterSettingsContainer, config);
        adapterSettings.style.display = 'block';
    } else {
        adapterSettingsContainer.innerHTML = '';
        adapterSettings.style.display = 'none';
    }
}

// Populate settings form for the selected adapter
function populateAdapterSettings(adapterId, adapterSettingsDiv, config) {
    streams = config.streams;
    adapterSettingsDiv.innerHTML = `
        <h2>Modulator Adapter ${adapterId}</h2>
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
            <div id="stream-assignments-${adapterId}" class="stream-assignments-container">
                ${populateStreamAssignments(adapterId, streams)}
            </div>
            <button type="button" id="save-button-${adapterId}" disabled onclick="saveConfig(${adapterId})">Save</button>
            <button type="button" id="apply-button-${adapterId}" onclick="applyConfig(${adapterId})">Apply</button>
        
        </form>
    `;

    // Add event listeners for frequency, channels, and standard inputs
    const frequencyInput = document.getElementById(`frequency-${adapterId}`);
    const channelsInput = document.getElementById(`channels-${adapterId}`);
    const standardInput = document.getElementById(`standard-${adapterId}`);
    const connectorInput = document.getElementById(`connector-${adapterId}`);
    const powerInput = document.getElementById(`power-${adapterId}`);

    if (frequencyInput && channelsInput && standardInput) {
        [frequencyInput, channelsInput, standardInput, connectorInput, powerInput].forEach(input => {
            input.addEventListener('input', () => updateStreamAssignments(adapterId, true));
        });

    } else {
        console.error('Error: Required inputs are missing during event listener setup.');
    }
    updateStreamAssignments(adapterId)
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

    //ToDo: not sure if this is correct and necessary
    // if (standard === "DVBT_7") {
    //     channelSpacing = 7;
    // } else if (standard === "DVBT_6") {
    //     channelSpacing = 6;
    // }

    for (let i = 0; i < numberOfChannels; i++) {
        const channelFrequency = baseFrequency + i * channelSpacing;
        const streamAssignment = document.createElement('div');
        streamAssignment.classList.add('stream-assignment');

        let optionsHtml = `<option value="">None</option>`;
        for (let j = 0; j < adapterData[adapterId].length; j++) {
            // Check if the current stream is assigned to this channel
            const isSelected = streams.some(s => s.channel === i && s.stream === j);
            optionsHtml += `<option value="${j}" ${isSelected ? 'selected' : ''}>mod ${j}</option>`;
        }

        streamAssignment.innerHTML = `
            <label>Slot ${i} (${channelFrequency.toFixed(1)} MHz)</label>
            <select name="stream[${i}]" class="select-item-${adapterId} mod-select" data-channel="${i}">
                ${optionsHtml}
            </select>
        `;
        assignmentsHTML += streamAssignment.outerHTML;
    }

    streamAssignmentsDiv.innerHTML = assignmentsHTML;
    const selectInput = streamAssignmentsDiv.querySelectorAll(`.select-item-${adapterId}`);

    selectInput.forEach(select => {
        select.addEventListener('change', () => {
            document.getElementById(`save-button-${adapterId}`).disabled = false;
            document.getElementById(`apply-button-${adapterId}`).disabled = true;
        });
    });
    // Detect if any changes have been made to the stream assignments
    selectDetector()
}

// Update the stream assignments when frequency, channels, or standard change
function updateStreamAssignments(adapterId, isChange) {
    const saveButton = document.getElementById(`save-button-${adapterId}`);
    const applyButton = document.getElementById(`apply-button-${adapterId}`);
    if (isChange) {
        saveButton.disabled = false;
        applyButton.disabled = true;
    }
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
        const response = await fetch(`/save_modulator_config/${adapterId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const r_data = await response.json(); // Extract JSON content from the response
        if (response.ok) {
            if (r_data.status == "success") {
                alert('Configuration saved successfully!');
                document.getElementById(`save-button-${adapterId}`).disabled = true;
                document.getElementById(`apply-button-${adapterId}`).disabled = false;
            }
        } else {
            alert('Failed to save configuration.');
        }
    } catch (error) {
        console.error('Error saving configuration:', error);
        alert('Failed to save configuration.');
    }
}

async function applyConfig(adapterId) {
    try {
        const response = await fetch(`/apply_modulator_config/${adapterId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const r_data = await response.json(); // Extract JSON content from the response

        if (response.ok) {
            if (r_data.status == "success") {
                alert(`Configuration Applied successfully! Status: ${r_data.msg}`);
            } else if(r_data.status == "error") {
                alert(`Configuration saving Error: ${r_data.msg}`);
            } 
        } else {
            alert(`Failed to Apply configuration. Status: ${r_data.status || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error Applying configuration:', error);
        alert('Failed to Applying configuration.');
    }
}


function selectDetector() {
    const streamAssignments = document.querySelectorAll('.mod-select');
    streamAssignments.forEach(select => {
        select.addEventListener("change", function () {
            const selectedValue = this.value;
            if (selectedValue) {
                document.querySelectorAll("select").forEach(otherSelect => {
                    if (otherSelect !== this && otherSelect.value === selectedValue) {
                        otherSelect.value = "";
                    }
                });
            }
        });
    });
}
// Initialize the page on load
document.addEventListener('DOMContentLoaded', init);