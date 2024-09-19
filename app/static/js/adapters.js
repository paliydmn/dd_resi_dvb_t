import {
    startFFmpeg,
    stopFFmpeg,
    scanAdapter,
    deleteAdapter,
    toggleMenu,
    stopAllffmpegs
} from './modules/adapter/controlls.js';

window.adapterIds = [];

document.addEventListener('DOMContentLoaded', function () {
    updateAdapters();
    
    document.getElementById('stop-all-ffmpegs').addEventListener('click', stopAllffmpegs);
    document.getElementById('existing-adapters').addEventListener('click', function (event) {
        const target = event.target;
        const aId = target.getAttribute('data-adapter-id');

        if (target.classList.contains('start-ffmpeg')) {
            startFFmpeg(aId);
        } else if (target.classList.contains('stop-ffmpeg')) {
            stopFFmpeg(aId);
        } else if (target.classList.contains('scan-adapter')) {
            scanAdapter(aId);
        } else if (target.classList.contains('delete-adapter')) {
            deleteAdapter(aId);
        } else if (target.classList.contains('menu-button')) {
            const menuId = target.getAttribute('data-menu-id');
            toggleMenu(menuId);
        } else if (target.classList.contains('toggle-program-details')) {
            const programTitle = target.getAttribute('data-program');
            toggleProgramDetails(programTitle);
        } else if (target.classList.contains('toggle-url-list')) {
            const urlListId = target.getAttribute('data-url-list-id');
            toggleUrlList(urlListId);
        }
    });
});



export function updateAdapters(aId = null) {
    const url = aId ? `/get_adapter/${aId}/` : '/get_adapters/';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (aId) {
                updateAdapterDiv(aId, data);
            } else {
                const adapterContainer = document.getElementById('existing-adapters');
                adapterContainer.innerHTML = ''; // Clear the container

                Object.entries(data).forEach(([id, adapter]) => {
                    updateAdapterDiv(id, adapter);
                    if (!window.adapterIds.includes(id)) {
                        window.adapterIds.push(id);
                    }
                });
            }
            // Request the stream list after updating the adapters to set Bitrate
            window.parent.postMessage({request: 'stream-list'}, '*');
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

function updateAdapterDiv(aId, adapter) {
    const adapterDiv = document.getElementById(`adapter-${aId}`) || document.createElement('div');
    adapterDiv.id = `adapter-${aId}`;
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
                <a href="javascript:void(0);" class="toggle-program-details" data-program="${program.title}-${aId}" data-program-title="${program.title}">
                    ${program.title}
                </a>
                <div id="program-details-${program.title}-${aId}" class="program-details" style="display:none; margin-left: 20px;">
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
            <a href="javascript:void(0);" class="toggle-url-list" data-url-list-id="${aId}-urls">UDP URLs: &#11206;</a>
            <ul id="${aId}-urls" style="display:none;">
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
            <div id="total-bitrate"></div>
            </ul>
        </div>
        <div id="scan-section-${aId}">
            <!-- Scan results will be loaded here -->
        </div>
        
        <!-- Duplicate Start/Stop buttons for faster control -->
        <div class="adapter-control-buttons">
            <button class="start-ffmpeg" data-adapter-id="${aId}" ${adapter.running ? 'disabled' : ''}>Start</button>
            <button class="stop-ffmpeg" data-adapter-id="${aId}" ${adapter.running ? '' : 'disabled'}>Stop</button>
        </div>
        <!-- Menu with dropdown -->
        <div class="adapter-menu">
            <div class="menu-button" data-menu-id="${aId}-menu">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <div id="${aId}-menu" class="menu-dropdown" style="display: none;">
                <button class="scan-adapter" data-adapter-id="${aId}">Scan</button>
                <button class="start-ffmpeg" data-adapter-id="${aId}" ${adapter.running ? 'disabled' : ''}>Start</button>
                <button class="stop-ffmpeg" data-adapter-id="${aId}" ${adapter.running ? '' : 'disabled'}>Stop</button>
                <button class="delete-adapter" data-adapter-id="${aId}">Delete</button>
            </div>
        </div>
    `;

    if (!document.getElementById(`adapter-${aId}`)) {
        document.getElementById('existing-adapters').appendChild(adapterDiv);
    }
}

// Listen for incoming messages
window.addEventListener('message', function(event) {
    if (event.data.event === 'stream-event') {
        const data = event.data.data;
        const programs = document.querySelectorAll('[data-stream-id]');
        programs.forEach(li => { 
                if(li.getAttribute('data-stream-id') === data.channel_id){
                     const programLink = li.querySelector('a.toggle-program-details');
                        
                        if (programLink) {
                            // Update the text content with the bitrate
                            programLink.textContent = `${programLink.textContent.split(' - ')[0]} - ${Math.round(data.bitrate)} Kbit/s`;                        }
                    }
            })
        }

     if (event.data.response === 'stream-list') {
         const astraStreams = event.data.streams; // Assuming the data comes this way
         // Select all divs with an id starting with 'adapter-'
            document.querySelectorAll('div[id^="adapter-"]').forEach(div => {
              // Extract the part of the ID after 'adapter-'
              const id = div.id.match(/^adapter-(.*)$/)[1];
              addStreamIdsToProgramList(id, astraStreams);
            });
         
     }
});

function addStreamIdsToProgramList(aId, astraStreams) {
    const programList = document.querySelectorAll(`#adapter-${aId} ul#selected-channels-list li`);
    
    programList.forEach(li => {
        const programNameLink = li.querySelector('a.toggle-program-details');
        const programName = programNameLink.dataset.programTitle; // Get the program name
        const udpUrls = Array.from(document.getElementById(`${aId}-urls`).getElementsByTagName("li"))
            .map(li => li.textContent.trim().split(' ')[0])
            .filter(link => link.startsWith('udp://'));
        
        // Find the matching stream from astraStreams
        const matchingStream = astraStreams.find(stream => {
            if(stream.output && stream.enable && stream.type === 'spts'){
                let strUdpUrls = stream.output.filter(url => url.startsWith('udp://'));
                return stream.name === programName && strUdpUrls.some(url => udpUrls.includes(url));
            }
        });

        if (matchingStream) {
            li.setAttribute('data-stream-id', matchingStream.id); // Add the ID as a data attribute
        }
    });
}


function setTotalBitrate(aId) {
    const adapterDiv = document.getElementById(`adapter-${aId}`);
    if (!adapterDiv) return;

    const channelsList = adapterDiv.querySelectorAll('#selected-channels-list li a.toggle-program-details');
    let totalBitrate = 0;

    channelsList.forEach(channel => {
        const bitrateText = channel.textContent.match(/- (\d+) Kbit\/s/);
        if (bitrateText) {
            totalBitrate += parseInt(bitrateText[1], 10);
            if (bitrateText[1] === "0") {
                channel.style.color = 'red';
            }else {
                channel.style.color = '#3498db';
            }
        }
    });

    if (totalBitrate === 0) return; // Skip if no programs have a bitrate

    const totalBitrateDiv = adapterDiv.querySelector('#total-bitrate');
    totalBitrateDiv.textContent = totalBitrate + ' Kbit/s';

    // Set color based on the total bitrate
    if (totalBitrate < 25000) {
        totalBitrateDiv.style.color = 'green';
    } else if (totalBitrate > 29000) {
        totalBitrateDiv.style.color = 'red';
    } else {
        totalBitrateDiv.style.color = 'orange';
    }
}

setInterval(function() {
    window.adapterIds.forEach(id => {
        setTotalBitrate(id);
    });
}, 1000);
