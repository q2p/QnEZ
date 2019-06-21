function discardAllTabs():void {
	chrome.tabs.query({ active: false }, function (tabs) {
		for(let tab of tabs)
			if(!tab.discarded)
				chrome.tabs.discard(tab.id);
	});
}
document.getElementById('discard_all_tabs').addEventListener('click', discardAllTabs, false);