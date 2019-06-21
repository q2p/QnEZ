const errorMessage:HTMLElement = document.getElementById('error_message');
const dismissErrorElement:HTMLElement = document.getElementById('dismiss_error');

dismissErrorElement.addEventListener('click', dismissError, false);

function showError(message:string) {
	errorMessage.innerText = message;
	setVisibility(errorMessage, true);
	setVisibility(dismissErrorElement, true);
}

function dismissError() {
	errorMessage.innerText = '';
	setVisibility(errorMessage, false);
	setVisibility(dismissErrorElement, false);
}