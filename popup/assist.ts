function setElementEnabled(button:HTMLElement, enabled:boolean) {
	if(enabled)
		button.classList.remove('disabled');
	else
		button.classList.add('disabled');
}

function setVisibility(element:HTMLElement, visible:boolean) {
	element.style.display = visible ? 'block' : 'none';
}

function variableIs(variable:any, type:string) {
	return variable !== undefined && variable !== null && typeof(variable) === type;
}