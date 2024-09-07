export function showPopup(message, status) {
    const popup = document.getElementById('alert-popup');
    const header = document.getElementById('alert-header');
    const messageBody = document.getElementById('alert-message');

    // Set message content
    messageBody.innerHTML = message;

    // Reset classes
    popup.classList.remove('success', 'error', 'hidden', 'visible');

    if (status === "success") {
        header.innerHTML = "Success";
        popup.classList.add('success');
    } else if (status === "error") {
        header.innerHTML = "Error";
        popup.classList.add('error');
    }

    // Show the popup
    popup.classList.add('visible');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        popup.classList.add('hidden');
        popup.classList.remove('visible');
    }, 4000);

    // Allow clicking to close
    popup.addEventListener('click', () => {
        popup.classList.add('hidden');
        popup.classList.remove('visible');
    });
}
