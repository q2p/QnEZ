function setElementEnabled(button:HTMLElement, enabled:boolean) {
	if(enabled)
		button.classList.remove('disabled');
	else
		button.classList.add('disabled');
}

function setVisibility(element:HTMLElement, visible:boolean) {
	element.style.display = visible ? 'block' : 'none';
}