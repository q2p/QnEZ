function split_window(tab_objects:any[], tab_ids:number[]) {
	chrome.runtime.sendMessage({
		action: "split_window",
		incognito: tab_objects[0].incognito,
		tabIds: tab_ids
	}, ()=>{});
}

function discard_tabs(tab_objects:any[], tab_ids:number[]) {
	for(let tab of tab_objects) {
		if(!tab.discarded) {
			chrome.tabs.discard(tab.id);
		}
	}
}

function bookmark_tabs(tab_objects:any[], tab_ids:number[]) {
	for(let tab of tab_objects) {
		chrome.bookmarks.create({ parentId: bookmarks_container_id, title: tab.title, url: tab.url });
	}
}

function bookmark_and_close_tabs(tab_objects:any[], tab_ids:number[]) {
	bookmark_tabs(tab_objects, tab_ids);
	chrome.tabs.remove(tab_ids);
}