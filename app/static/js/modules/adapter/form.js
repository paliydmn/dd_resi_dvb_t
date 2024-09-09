import { showPopup } from '../utils/popup.js';
import { updateAdapters } from '../../adapters.js';


document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('url-type').addEventListener('change', toggleUrlInputs);
    document.getElementById('new-adapter-form').addEventListener('click', showNewAdapterForm);

    document.getElementById('new-adapter-modal-submit').addEventListener('click', handleFormSubmit);
    document.getElementById('new-adapter-modal-cancel').addEventListener('click', hideNewAdapterForm);
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
    event.preventDefault();
    const urlType = document.getElementById("url-type").value;

    if (urlType === "mpts") {
        createSingleUrlAdapter(event);
    } else if (urlType === "spts") {
        createMultiUrlAdapter(event);
    }
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

function createAdapter(event, type, udpUrls) {
    event.preventDefault();
    const adapterNumber = document.getElementById('adapter-number').value;
    const modulatorNumber = document.getElementById('modulator-number').value;
    const adapterName = document.getElementById('adapter-name').value;

    // Create UdpUrlConfig objects
    const udpUrlConfigs = udpUrls.map(url => ({
        udp_url: url,
        astra_stream_id: null // or any other logic to set astra_stream_id
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

function createMultiUrlAdapter(event) {
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

    if (urlType === "spts") {
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