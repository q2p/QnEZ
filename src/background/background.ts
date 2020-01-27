const isFF = typeof(browser) !== "undefined";

function createContextMenu():void {
	chrome.contextMenus.removeAll(() => {
		chrome.contextMenus.create(
			{
				id: "save_it",
				title: "Save It",
				contexts: [ "all" ]
			}
		);
	});
}

// Context menu on click
function contextMenuClick(info:any):void {
	if(info.menuItemId !== "save_it")
		return;
	
	const target = info.srcUrl || info.linkUrl || info.pageUrl; 
	
	if(!target) {
		alert("QnEZ error: Can't get the url to save");
		return;
	}
	
	chrome.downloads.download({
		url: target,
		// TODO: "prompt" is not yet implemented in FF
		conflictAction: isFF ? "uniquify" : "prompt",
		saveAs: false,
	}, (downloadId:number) => {
		if(downloadId === undefined)
			alert("QnEZ error: Failed to begin download:\n"+chrome.runtime.lastError);
	});
}

// Receive commands
function onCommand(command:string):void {
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
			
			let container_id = localStorage.getItem("bm_container");
			if(container_id !== null) {
				chrome.bookmarks.get(container_id, (sub_tree:any[]) => {
					if(sub_tree !== undefined && sub_tree.length === 1 && sub_tree[0].url === undefined) {
						container_id = sub_tree[0].id;

						for(let tab of tabs)
							chrome.bookmarks.create({ parentId: container_id, title: tab.title, url: tab.url });

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
}

// Split window message receiver
function onMessage(request:any, sender:any, sendResponse:any):void {
	if(request.action === "split_window") {
		let options:any = { incognito: request.incognito, type: "normal" };

		if(!isFF) {
			// TODO: "focused" is not implemented in FF
			options.focused = false;
		}

		chrome.windows.create(options, (newWindow:any) => {
			chrome.tabs.move(request.tabIds, { windowId: newWindow.id, index: -1 });
		});
	}
}

if(!chrome.contextMenus.onClicked.hasListener(contextMenuClick)) {
	// Discard tabs
	chrome.runtime.onStartup.addListener(() => {
		chrome.tabs.query({}, (tabs) => {
			for(let tab of tabs)
				if(tab !== undefined && !tab.discarded)
					chrome.tabs.discard(tab.id);
		});
	});
	// Create context menu
	createContextMenu();
	/*
	if (chrome.runtime.onInstalled) {
		chrome.runtime.onInstalled.addListener(() => {
			createContextMenu();
		});
	}*/
	chrome.contextMenus.onClicked.addListener(contextMenuClick);
	chrome.commands.onCommand.addListener(onCommand);
	chrome.runtime.onMessage.addListener(onMessage);
}