import {
    showPopup
} from '../utils/popup.js';
import {
    updateAdapters
} from '../../adapters.js';


let astraStreams = [];

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('url-type').addEventListener('change', toggleUrlInputs);
    document.getElementById('new-adapter-form').addEventListener('click', showNewAdapterForm);

    document.getElementById('new-adapter-modal-submit').addEventListener('click', handleFormSubmit);
    document.getElementById('new-adapter-modal-cancel').addEventListener('click', hideNewAdapterForm);


    window.addEventListener('message', function (event) {
        if (event.data.response === 'stream-list') {
            window.addEventListener('message', function (event) {
                if (event.data.response === 'stream-list') {
                    const streams = event.data.streams;
                    astraStreams = filterSptsStreams(streams);
                    console.log(astraStreams);
                }
            });

        }
    });
});


export function showNewAdapterForm() {
    document.getElementById('new-adapter-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    fetchAvailableAdapters(); // Call this function when the modal is shown
}

export function hideNewAdapterForm() {
    document.getElementById('new-adapter-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
    resetNewAdapterForm()
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
        <button type="button" class="remove-url-button">-</button><br>
    `;
    urlContainer.insertBefore(newInput, document.getElementById("add-new-spts-url"));
    newInput.querySelector('.remove-url-button').addEventListener('click', function () {
        removeUrlInput(inputCount + 1);
    });
}


export function removeUrlInput(index) {
    const urlInput = document.getElementById(`url-input-${index}`);
    urlInput.remove();
}

export function handleFormSubmit(event) {
    const form = document.getElementById('adapter-form');

    // Check form validity
    if (!form.checkValidity()) {
        // Prevent form submission if any fields are invalid
        event.preventDefault();
        event.stopPropagation();
        form.reportValidity();
        return;
    }

    const urlType = document.getElementById("url-type").value;

    // Prevent default form submission to handle it via JavaScript
    event.preventDefault();

    if (urlType === "mpts") {
        // Handle MPTS URL
        createSingleUrlAdapter(event);
    } else if (urlType === "spts") {
        // Handle SPTS URLs
        createMultiUrlAdapter(event);
    } else if (urlType === "astra_spts") {
        // Handle SPTS URLs
        createMultiUrlAdapter(event);
    }
}

function filterSptsStreams(data) {
    const filteredStreams = [];

    data.forEach(stream => {
        // Check if the stream type is "spts" and is enabled
        if (stream.type === "spts" && stream.enable === true) {
            const outputs = stream.output || [];
            const udpOutputs = outputs.filter(url => url.startsWith("udp://"));

            if (udpOutputs.length > 0) {
                filteredStreams.push({
                    id: stream.id,
                    program_name: stream.name,
                    input: stream.input,
                    udp_url: udpOutputs[0] // Use the first UDP URL
                });
            }
        }
    });

    return filteredStreams;
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

// function createAdapter(event, type, udpUrls) {
//     event.preventDefault();
//     const adapterNumber = document.getElementById('adapter-number').value;
//     const modulatorNumber = document.getElementById('modulator-number').value;
//     const adapterName = document.getElementById('adapter-name').value;

//     // Create UdpUrlConfig objects
//     const udpUrlConfigs = udpUrls.map(url => ({
//         udp_url: url,
//         astra_stream_id: null // or any other logic to set astra_stream_id
//     }));

//     // Create AdapterConfig object
//     const adapterConfig = {
//         adapter_number: adapterNumber,
//         modulator_number: modulatorNumber,
//         type: type,
//         adapter_name: adapterName,
//         udp_urls: udpUrlConfigs,
//         programs: {}, // Assuming no programs are selected initially
//         running: false,
//         description: null // or any other logic to set description
//     };

//     fetch('/adapters/createAdapter', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(adapterConfig)
//         })
//         .then(response => response.json())
//         .then(data => {
//             showPopup(data.msg, data.status);
//             hideNewAdapterForm();
//             updateAdapters(); // Reload the adapters list
//         })
//         .catch(error => showPopup(error, "error"));
// }

function createAdapter(event, type, udpUrls) {
    event.preventDefault();
    const adapterNumber = document.getElementById('adapter-number').value;
    const modulatorNumber = document.getElementById('modulator-number').value;
    const adapterName = document.getElementById('adapter-name').value;

    // Create UdpUrlConfig objects with stream ID and URL
    const udpUrlConfigs = udpUrls.map(urlObj => ({
        udp_url: urlObj.url,
        astra_stream_id: urlObj.streamId // Assign the stream ID here
    }));

    // Create AdapterConfig object
    const adapterConfig = {
        adapter_number: adapterNumber,
        modulator_number: modulatorNumber,
        type: type,
        adapter_name: adapterName,
        udp_urls: udpUrlConfigs,
        programs: {}, // Assuming no programs are selected initially
        running: false,
        description: null // or any other logic to set description
    };

    fetch('/adapters/createAdapter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adapterConfig)
        })
        .then(response => response.json())
        .then(data => {
            showPopup(data.msg, data.status);
            hideNewAdapterForm();
            updateAdapters(); // Reload the adapters list
        })
        .catch(error => showPopup(error, "error"));
}


function createSingleUrlAdapter(event) {
    const udpUrl = document.getElementById('udp-url').value;
    createAdapter(event, 'MPTS', [udpUrl]);
}

// function createMultiUrlAdapter(event) {
//     const urlInputs = document.querySelectorAll('.udp-url-input');
//     const udpUrls = [];

//     urlInputs.forEach(input => {
//         if (input.value.trim() !== "") {
//             udpUrls.push(input.value.trim());
//         }
//     });

//     // Check for duplicate URLs
//     const duplicateUrls = udpUrls.filter((url, index) => udpUrls.indexOf(url) !== index);
//     if (duplicateUrls.length > 0) {
//         alert('Duplicate URLs found: ' + duplicateUrls.join(', ') + '. Please ensure all URLs are unique.');
//         return;
//     }

//     createAdapter(event, 'SPTS', udpUrls);
// }
function createMultiUrlAdapter(event) {
    const urlInputs = document.querySelectorAll('.udp-url-input');
    const udpUrls = [];

    // Collect both URL and the associated stream ID
    urlInputs.forEach(input => {
        if (input.value.trim() !== "") {
            const streamId = input.getAttribute('data-stream-id'); // Get the stream ID from the data attribute
            udpUrls.push({
                url: input.value.trim(),
                streamId: streamId
            });
        }
    });

    // Check for duplicate URLs
    const duplicateUrls = udpUrls.filter((urlObj, index, self) =>
        self.findIndex(u => u.url === urlObj.url) !== index
    ).map(u => u.url);

    if (duplicateUrls.length > 0) {
        alert('Duplicate URLs found: ' + duplicateUrls.join(', ') + '. Please ensure all URLs are unique.');
        return;
    }

    createAdapter(event, 'SPTS', udpUrls);
}


function fetchAvailableAdapters() {
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
        .catch(error => showPopup(`Error fetching available adapters: ${error}`, "error"));
}

function toggleUrlInputs() {
    const urlType = document.getElementById("url-type").value;
    const urlContainer = document.getElementById("url-input-container");

    if (urlType === 'astra_spts') {
        // Show the Astra SPTS modal
        showAstraSptsForm();
    } else if (urlType === "spts") {
        urlContainer.innerHTML = `
            <div id="url-input-1" class="url-input-wrapper">
                <label for="udp-url-1">UDP URL 1:</label>
                <input type="text" id="udp-url-1" name="udp-url" class="udp-url-input" required><br>
            </div>
            <div id="add-new-spts-url">
                <button type="button" id="add-spts-url-input">Add SPTS URL</button>
            </div>
        `;
        document.getElementById('add-spts-url-input').addEventListener('click', addUrlInput);
    } else {
        urlContainer.innerHTML = `
            <label for="udp-url">UDP URL:</label>
            <input type="text" id="udp-url" name="udp-url" class="udp-url-input" required><br>
        `;
    }
}

// function toggleUrlInputs() {
//     const urlType = document.getElementById('url-type').value;
//     const urlContainer = document.getElementById('url-input-container');

//     if (urlType === 'astra_spts') {
//         // Show the Astra SPTS modal
//         showAstraSptsForm();
//     } else {
//         urlContainer.innerHTML = ''; // Clear previous inputs
//         if (urlType === 'mpts' || urlType === 'spts') {
//             addUrlInput(); // Show the usual UDP URL input field(s)
//         }
//     }
// }


////////////////////////////////////////////////////////////////
document.getElementById('url-type').addEventListener('change', toggleUrlInputs);



function showAstraSptsForm() {
    // Show modal for Astra SPTS streams
    document.getElementById('astra-spts-modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';

    window.parent.postMessage({
        request: 'stream-list'
    }, '*');
    const astraSptsSection = document.getElementById(`astra-spts-modal`);

    // Add a spinner to indicate loading
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.innerHTML = `<div class="loading-spinner"></div>`;
    astraSptsSection.appendChild(spinner);
    setTimeout(() => {
        if (astraStreams.length > 0) {
            astraSptsSection.removeChild(spinner);
            populateAstraSptsList(astraStreams);
        } else {
            fetch('/adapter/astraApi/info')
                .then(response => response.json())
                .then(data => {
                    astraSptsSection.removeChild(spinner);
                    populateAstraSptsList(data);
                })
                .catch(error => {
                    astraSptsSection.removeChild(spinner);
                    showPopup(error, "error")
                });
        }
    }, 1000);
    
    // Fetch Astra SPTS streams from the backend
    // fetch('/adapter/astraApi/info')
    //     .then(response => response.json())
    //     .then(data => {
    //         populateAstraSptsList(data);
    //     })
    //     .catch(error => showPopup(error, "error"));
}

function populateAstraSptsList(data) {
    const sptsListContainer = document.getElementById('astra-spts-list');
    sptsListContainer.innerHTML = ''; // Clear any previous list

    // Loop through the streams and create checkboxes for each
    data.forEach(stream => {
        const streamDiv = document.createElement('div');
        streamDiv.innerHTML = `
            <input type="checkbox" id="spts-${stream.id}" name="spts-stream" value="${stream.udp_url}">
            <label for="spts-${stream.id}">${stream.program_name} (${stream.udp_url})</label>
        `;
        sptsListContainer.appendChild(streamDiv);
    });
}

document.getElementById('astra-spts-add-button').addEventListener('click', addSelectedSptsStreams);
document.getElementById('astra-spts-cancel-button').addEventListener('click', hideAstraSptsForm);

function addSelectedSptsStreams() {
    const selectedStreams = document.querySelectorAll('input[name="spts-stream"]:checked');
    const urlContainer = document.getElementById('url-input-container');
    urlContainer.innerHTML = ''; // Clear the current URL inputs

    // Add selected streams as individual URL fields
    selectedStreams.forEach((stream, index) => {
        const streamId = stream.id.split('-')[1]; // Extract the stream ID from the input's ID
        const newInput = document.createElement('div');
        newInput.classList.add('url-input-wrapper');
        newInput.innerHTML = `
            <label for="udp-url-${index + 1}">UDP URL ${index + 1} (ID: ${streamId}):</label>
            <input type="text" id="udp-url-${index + 1}" name="udp-url" class="udp-url-input" value="${stream.value}" required readonly data-stream-id="${streamId}">
        `;
        urlContainer.appendChild(newInput);
    });

    hideAstraSptsForm();
}


// function addSelectedSptsStreams() {
//     const selectedStreams = document.querySelectorAll('input[name="spts-stream"]:checked');
//     const urlContainer = document.getElementById('url-input-container');
//     urlContainer.innerHTML = ''; // Clear the current URL inputs

//     // Add selected streams as individual URL fields
//     selectedStreams.forEach((stream, index) => {
//         const streamId = stream.id.split('-')[1]; // Extract the stream ID from the input's ID
//         const newInput = document.createElement('div');
//         newInput.classList.add('url-input-wrapper');
//         newInput.innerHTML = `
//             <label for="udp-url-${index + 1}">UDP URL ${index + 1} (ID: ${streamId}):</label>
//             <input type="text" id="udp-url-${index + 1}" name="udp-url" class="udp-url-input" value="${stream.value}" required readonly>
//         `;
//         urlContainer.appendChild(newInput);
//     });

//     hideAstraSptsForm();
// }

// function addSelectedSptsStreams() {
//     const selectedStreams = document.querySelectorAll('input[name="spts-stream"]:checked');
//     const urlContainer = document.getElementById('url-input-container');
//     urlContainer.innerHTML = ''; // Clear the current URL inputs

//     // Add selected streams as individual URL fields
//     selectedStreams.forEach((stream, index) => {
//         const newInput = document.createElement('div');
//         newInput.classList.add('url-input-wrapper');
//         newInput.innerHTML = `
//             <label for="udp-url-${index + 1}">UDP URL ${index + 1}:</label>
//             <input type="text" id="udp-url-${index + 1}" name="udp-url" class="udp-url-input" value="${stream.value}" required readonly>
//         `;
//         urlContainer.appendChild(newInput);
//     });

//     hideAstraSptsForm();
// }

function hideAstraSptsForm() {
    document.getElementById('astra-spts-modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}