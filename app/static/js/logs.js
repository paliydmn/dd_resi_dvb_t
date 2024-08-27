let currentSocket;

// function loadLogFiles() {
//     fetch('/logs/list/')
//         .then(response => response.json())
//         .then(logFiles => {
//             const logFilesList = document.getElementById('log-files-list');
//             logFilesList.innerHTML = ''; // Clear the existing list

//             logFiles.forEach(file => {
//                 const listItem = document.createElement('li');
//                 listItem.innerHTML = `<a href="#" onclick="viewLogFile('${file}')">${file}</a>`; // Make the file name clickable
//                 logFilesList.appendChild(listItem); // Add the item to the list
//             });
//         })
//         .catch(error => console.error('Error loading log files:', error));
// }

function loadLogFiles() {
    fetch('/logs/list/')
        .then(response => response.json())
        .then(logFiles => {
            console.log('Log Files:', logFiles);  // Debugging line
            const logFilesList = document.getElementById('log-files-list');
            logFilesList.innerHTML = '';

            logFiles.forEach(file => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<a href="javascript:void(0);" onclick="viewLogFile('${file.name}')">${file.name}</a> - Last Modified: ${file.last_modified}`;
                logFilesList.appendChild(listItem);
            });
        })
        .catch(error => console.error('Error loading log files:', error));
}



function viewLogFile(fileName) {
    const logContent = document.getElementById('log-content');
    logContent.innerHTML = 'Loading...'; // Indicate loading

    // Close the existing WebSocket connection if it's open
    if (currentSocket) {
        currentSocket.close();
    }

    // Open a new WebSocket connection
    currentSocket = new WebSocket(`ws://${window.location.host}/ws/logs/${fileName}`);

    // Handle incoming messages (log lines)
    currentSocket.onmessage = function(event) {
        const newLine = event.data.replace(/\n/g, '<br>'); // Replace newlines with <br> for HTML display
        logContent.innerHTML += newLine; // Append new lines
        logContent.scrollTop = logContent.scrollHeight; // Scroll to the bottom
    };

    currentSocket.onerror = function(error) {
        console.error('WebSocket error:', error);
        logContent.innerHTML = 'Error loading log content.';
    };

    currentSocket.onclose = function() {
        console.log('WebSocket connection closed.');
    };
}

// Ensure that the log files are loaded when the page is ready
document.addEventListener('DOMContentLoaded', loadLogFiles);
