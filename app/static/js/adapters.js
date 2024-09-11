import {
    startFFmpeg,
    stopFFmpeg,
    scanAdapter,
    deleteAdapter,
    toggleMenu,
    stopAllffmpegs
} from './modules/adapter/controlls.js';

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
        } else if (target.classList.contains('toggle-program-details')) {
            const programTitle = target.getAttribute('data-program-title');
            toggleProgramDetails(programTitle);
        } else if (target.classList.contains('toggle-url-list')) {
            const urlListId = target.getAttribute('data-url-list-id');
            toggleUrlList(urlListId);
        }
    });
});



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
                <a href="javascript:void(0);" class="toggle-program-details" data-program-title="${program.title}-${adapterId}">
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
            <a href="javascript:void(0);" class="toggle-url-list" data-url-list-id="${adapterId}-urls">UDP URLs: &#11206;</a>
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