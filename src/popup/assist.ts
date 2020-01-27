function set_element_enabled(button:HTMLElement, enabled:boolean) {
	if(enabled)
		button.classList.remove('disabled');
	else
		button.classList.add('disabled');
}

function set_visibility(element:HTMLElement, visible:boolean) {
	if(visible)
		element.classList.remove('hidden');
	else
		element.classList.add('hidden');
}