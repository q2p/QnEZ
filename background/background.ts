const isFF = typeof(browser) !== "undefined";

chrome.runtime.onInstalled.addListener(() => {
	chrome.contextMenus.removeAll(() => {
		chrome.contextMenus.create(
			{
				id: "save_it",
				title: "Save It",
				contexts: [ "all" ]
			}
		);
	});
});

chrome.runtime.onStartup.addListener(() => {
	chrome.tabs.query({}, (tabs) => {
		for(let tab of tabs)
			if(tab !== undefined && !tab.discarded)
				chrome.tabs.discard(tab.id);
	});
});

let failedCommand:boolean = false;
chrome.commands.onCommand.addListener((command) => {
	switch(command) {
		case "discard_selected_tabs":
		case "bookmark_selected_tabs":
		case "bookmark_and_close_selected_tabs":
			break;
		default:
			return;
	}

	chrome.tabs.query({ currentWindow: true, highlighted: true }, (tabs) => {
		if(tabs.length === 0)
			return;

		try {
			if(command === "discard_selected_tabs") {
				for(let tab of tabs)
					if(!tab.discarded)
						chrome.tabs.discard(tab.id);
				return;
			}
			
			let containerId = localStorage.getItem("bm_container");
			if(containerId !== null) {
				chrome.bookmarks.get(containerId, (subTree:any[]) => {
					if(subTree !== undefined && subTree.length === 1 && subTree[0].url === undefined) {
						containerId = subTree[0].id;

						for(let tab of tabs)
							chrome.bookmarks.create({ parentId: containerId, title: tab.title, url: tab.url });

						if(command === "bookmark_and_close_selected_tabs")
							chrome.tabs.remove(tabs.map(tab => tab.id));
					} else {
						alert("QnEZ error: Failed to create bookmark, target folder is invalid or absent.");
					}
				});
			} else {
				alert("QnEZ error: Failed to create bookmark, target folder is invalid or absent.");
			}
		} catch(e) {
			alert("QnEZ error: Failed to complete the operation, something went wrong!");
		}
	});
});

chrome.contextMenus.onClicked.addListener((info:any) => {
	if(info.menuItemId !== "save_it")
		return;
	
	const target = info.srcUrl || info.linkUrl || info.pageUrl; 
	
	if(!target) {
		alert("QnEZ error: Can't get the url to save");
		return;
	}
	
	chrome.downloads.download({
		url: target,
		conflictAction: isFF ? "uniquify" : "prompt", // TODO: "prompt" is not yet implemented in FF
		saveAs: false,
	}, (downloadId:number) => {
		if(downloadId === undefined)
			alert("QnEZ error: Failed to begin download:\n"+chrome.runtime.lastError);
	});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if(request.action === "split_window") {
		let options:any = { incognito: request.incognito, type: "normal" };
		if(!isFF)
			options.focused = false; // TODO: "focused" is not implemented in FF
		chrome.windows.create(options, (newWindow:any) => {
			chrome.tabs.move(request.tabIds, { windowId: newWindow.id, index: -1 });
		});
	}
});