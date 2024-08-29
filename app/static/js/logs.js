let currentSocket;

function highlightLogFile(selectedFile) {
    const logFilesList = document.getElementById('log-files-list');
    Array.from(logFilesList.getElementsByTagName('li')).forEach(item => {
        item.classList.remove('highlight');
    });
    selectedFile.classList.add('highlight');
}

function loadLogFiles() {
    fetch('/logs/list/')
        .then(response => response.json())
        .then(logFiles => {
            console.log('Log Files:', logFiles);
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
    logContent.innerHTML = '';

    const selectedFile = event.target.parentElement;
    highlightLogFile(selectedFile);

    if (currentSocket) {
        currentSocket.close();
    }

    fetch(`/logs/last_lines/${fileName}?lines=10`)
        .then(response => response.text())
        .then(data => {
            data = data.trim().replace(/^"|"$/g, '');
            logContent.innerHTML = data.replace(/\\n/g, '<br>');
            openWebSocket(fileName, logContent);
        })
        .catch(error => {
            console.error('Error loading last lines:', error);
            logContent.innerHTML = 'Error loading log content.';
        });
}

function openWebSocket(fileName, logContent) {
    currentSocket = new WebSocket(`ws://${window.location.host}/ws/logs/${fileName}`);
    let lineCount = logContent.innerHTML.split('<br>').length;

    currentSocket.onmessage = function (event) {
        const newLine = event.data.replace(/\n/g, '<br>');
        logContent.innerHTML += newLine;
        lineCount++;

        // Get the maximum number of lines from the input field
        const maxLines = parseInt(document.getElementById('max-lines').value, 10) || 200;

        // Clear old lines if line count exceeds maxLines
        if (lineCount > maxLines) {
            const excessLines = lineCount - maxLines;
            logContent.innerHTML = logContent.innerHTML.split('<br>').slice(excessLines).join('<br>');
            lineCount = maxLines;
        }

        logContent.scrollTop = logContent.scrollHeight;
    };

    currentSocket.onerror = function (error) {
        console.error('WebSocket error:', error);
        logContent.innerHTML = 'Error loading log content.';
    };

    currentSocket.onclose = function () {
        console.log('WebSocket connection closed.');
    };
}

document.addEventListener('DOMContentLoaded', loadLogFiles);


// let currentSocket;

// function highlightLogFile(selectedFile) {
//     const logFilesList = document.getElementById('log-files-list');
//     Array.from(logFilesList.getElementsByTagName('li')).forEach(item => {
//         item.classList.remove('highlight');
//     });
//     selectedFile.classList.add('highlight');
// }


// function loadLogFiles() {
//     fetch('/logs/list/')
//         .then(response => response.json())
//         .then(logFiles => {
//             console.log('Log Files:', logFiles);
//             const logFilesList = document.getElementById('log-files-list');
//             logFilesList.innerHTML = '';

//             logFiles.forEach(file => {
//                 const listItem = document.createElement('li');
//                 listItem.innerHTML = `<a href="javascript:void(0);" onclick="viewLogFile('${file.name}')">${file.name}</a> - Last Modified: ${file.last_modified}`;
//                 logFilesList.appendChild(listItem);
//             });
//         })
//         .catch(error => console.error('Error loading log files:', error));
// }

// function viewLogFile(fileName) {
//     const logContent = document.getElementById('log-content');
//     logContent.innerHTML = 'Loading...';

//     const selectedFile = event.target.parentElement;
//     highlightLogFile(selectedFile);

//     // Close existing WebSocket if open
//     if (currentSocket) {
//         currentSocket.close();
//     }

//     fetch(`/logs/last_lines/${fileName}?lines=10`)
//         .then(response => response.text())
//         .then(data => {
//             logContent.innerHTML = data.replace(/\\n/g, '<br>');
//             openWebSocket(fileName, logContent);
//         })
//         .catch(error => {
//             console.error('Error loading last lines:', error);
//             logContent.innerHTML = 'Error loading log content.';
//         });
// }

// function openWebSocket(fileName, logContent) {
//     currentSocket = new WebSocket(`ws://${window.location.host}/ws/logs/${fileName}`);
//     let lineCount = logContent.innerHTML.split('<br>').length;

//     currentSocket.onmessage = function (event) {
//         const newLine = event.data.replace(/\n/g, '<br>');
//         logContent.innerHTML += newLine;
//         lineCount++;

//         // Clear old lines if line count exceeds 200
//         if (lineCount > 200) {
//             const excessLines = lineCount - 200;
//             logContent.innerHTML = logContent.innerHTML.split('<br>').slice(excessLines).join('<br>');
//             lineCount = 200;
//         }

//         logContent.scrollTop = logContent.scrollHeight;
//     };

//     currentSocket.onerror = function (error) {
//         console.error('WebSocket error:', error);
//         logContent.innerHTML = 'Error loading log content.';
//     };

//     currentSocket.onclose = function () {
//         console.log('WebSocket connection closed.');
//     };
// }

// document.addEventListener('DOMContentLoaded', loadLogFiles);