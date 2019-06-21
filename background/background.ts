chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create(
      {
				id: 'save_it',
				title: 'Save It',
				contexts: [ 'all' ]
			}
    );
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({}, function (tabs) {
    for(let tab of tabs)
      if(tab !== undefined && !tab.discarded)
        chrome.tabs.discard(tab.id);
  });
});

let failedCommand:boolean = false;
chrome.commands.onCommand.addListener((command) => {
  failedCommand = false;
  switch(command) {
    case 'discard_current_tab':
    case 'bookmark_current_tab':
    case 'bookmark_and_close_current_tab':
      chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        if(tabs.length !== 1)
          return;
        
        let tab = tabs[0];

        try {
          if(command === 'discard_current_tab') {
            chrome.tabs.discard(tab.id);
          } else { 
            let containerId = localStorage.getItem("bm_container");
            if(containerId !== null) {
              chrome.bookmarks.get(containerId, (subTree:any[]) => {
                if(subTree.length === 1 && subTree[0].url === undefined) {
                  chrome.bookmarks.create({ parentId: subTree[0].id, title: tab.title, url: tab.url });
                } else {
                  failedCommand = true;
                  alert('QnEZ error: Failed to create bookmark, target folder is invalid or absent.');
                }
              });
            } else {
              failedCommand = true;
              alert('QnEZ error: Failed to create bookmark, target folder is invalid or absent.');
            }
            if(command === 'bookmark_and_close_current_tab' && !failedCommand)
              chrome.tabs.remove(tab.id);
          }
        } catch(e) {
          alert('QnEZ error: Failed to complete the operation, something went wrong!');
        }
      });
      break;
  }
});

chrome.contextMenus.onClicked.addListener((info:any) => {
  if(info.menuItemId !== 'save_it')
    return;
  
  const target = info.srcUrl || info.linkUrl || info.pageUrl; 
  
  if(!target) {
    alert('QnEZ error: Can\'t get the url to save');
    return;
  }
  
  chrome.downloads.download({
    url: target,
		conflictAction: 'prompt',
		saveAs: false,
  }, (downloadId:number) => {
		if(downloadId === undefined)
			alert('QnEZ error: Failed to begin download:\n'+chrome.runtime.lastError);
	});
});