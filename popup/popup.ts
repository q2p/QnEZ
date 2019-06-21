const applyToLeft = document.getElementById("left");
const applyToRight = document.getElementById("right");
const applyToLeftAndRight = document.getElementById("left_and_right");
const applyToSelected = document.getElementById("selected");

interface ActionHolder {
	element:HTMLElement,
	action:(tabObjects:object[], tabIds:number[])=>void,
	actionRequiresBookmarks:boolean,
	actionRequiresTabObjects:boolean,
	actionRequiresTabIds:boolean
};
const actions:ActionHolder[] = [
	{
		element: document.getElementById("action_bookmark"),
		action: bookmarkTabs,
		actionRequiresBookmarks: true,
		actionRequiresTabObjects: true,
		actionRequiresTabIds: false
	},
	{
		element: document.getElementById("action_bookmark_and_close"),
		action: bookmarkAndCloseTabs,
		actionRequiresBookmarks: true,
		actionRequiresTabObjects: true,
		actionRequiresTabIds: true
	},
	{
		element: document.getElementById("action_discard"),
		action: discardTabs,
		actionRequiresBookmarks: false,
		actionRequiresTabObjects: false,
		actionRequiresTabIds: true
	},
	{
		element: document.getElementById("action_split_window"),
		action: splitWindow,
		actionRequiresBookmarks: false,
		actionRequiresTabObjects: false,
		actionRequiresTabIds: true
	}
];

for(let i = 0; i != actions.length; i++)
	actions[i].element.addEventListener("click", () => { pickAction(i, true); }, false);

let currentAction:number = 0;

const bookmarksFolderInput:HTMLInputElement = <HTMLInputElement> document.getElementById("bookmarks_folder");
let bookmarksContainerId:string = null;

const bookmarksSet:HTMLElement = document.getElementById("bookmarks_set");
const bookmarksReset:HTMLElement = document.getElementById("bookmarks_reset");

bookmarksSet.addEventListener("click", setBookmarkContainer, false);
bookmarksReset.addEventListener("click", resetBookmarkContainer, false);

function execOnLR(left:boolean, right:boolean):void {
	chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
		if(tabs.length === 0)
			return;
		
		let activeIdx = tabs[0].index;

		chrome.tabs.query({ currentWindow: true }, (tabs) => {
			let filteredTabs:object[] = [];
			let filteredTabIds:number[] = [];
			if(actions[currentAction].actionRequiresTabObjects && actions[currentAction].actionRequiresTabIds) {
				for(let tab of tabs) {
					if(((left && tab.index < activeIdx) || (right && tab.index > activeIdx))) {
						filteredTabs.push(tab);
						filteredTabIds.push(tab.id);
					}
				}
			} else if(actions[currentAction].actionRequiresTabObjects) {
				for(let tab of tabs)
					if(((left && tab.index < activeIdx) || (right && tab.index > activeIdx)))
						filteredTabs.push(tab);
			} else {
				for(let tab of tabs)
					if(((left && tab.index < activeIdx) || (right && tab.index > activeIdx)))
						filteredTabIds.push(tab.id);
			}
			actions[currentAction].action(filteredTabs, filteredTabIds);
		});
	});
}

function execOnSelected():void {
	chrome.tabs.query({ currentWindow: true, highlighted: true }, function (tabs) {
		if(tabs.length === 0)
			return;
			
		let tabIds:number[] = [];
		if(actions[currentAction].actionRequiresTabIds) {
			for(let tab of tabs)
			tabIds.push(tab.id);
		}

		if(!actions[currentAction].actionRequiresTabObjects)
			tabs.length = 0;
			
		actions[currentAction].action(tabs, tabIds);
	});
}

applyToLeft.addEventListener("click", () => execOnLR(true, false), false);
applyToRight.addEventListener("click", () => execOnLR(false, true), false);
applyToLeftAndRight.addEventListener("click", () => execOnLR(true, true), false);
applyToSelected.addEventListener("click", () => execOnSelected(), false);

function setApplyToButtonsEnabled(enabled:boolean) {
	setElementEnabled(applyToLeft, enabled);
	setElementEnabled(applyToRight, enabled);
	setElementEnabled(applyToLeftAndRight, enabled);
	setElementEnabled(applyToSelected, enabled);
}

setApplyToButtonsEnabled(false);

function splitWindow(tabObjects:any[], tabIds:number[]) {
	chrome.windows.getCurrent({ populate: false, windowTypes: [ "normal" ] }, (oldWindow:any) => {
		chrome.windows.create({focused: false, incognito: oldWindow.incognito, type: "normal" }, (newWindow:any) => {
			chrome.tabs.move(tabIds, { windowId: newWindow.id, index: -1 });
		});
	});
}

function discardTabs(tabObjects:any[], tabIds:number[]) {
	for(let tabId of tabIds)
		chrome.tabs.discard(tabId);
}

function bookmarkTabs(tabObjects:any[], tabIds:number[]) {
	for(let tab of tabObjects)
		chrome.bookmarks.create({ parentId: bookmarksContainerId, title: tab.title, url: tab.url });
}

function bookmarkAndCloseTabs(tabObjects:any[], tabIds:number[]) {
	bookmarkTabs(tabObjects, tabIds);
	chrome.tabs.remove(tabIds);
}

function pickAction(i:number, saveAction:boolean) {
	actions[currentAction].element.classList.remove("selected");
	actions[i].element.classList.add("selected");
	currentAction = i;
	setApplyToButtonsEnabled(!actions[currentAction].actionRequiresBookmarks || (bookmarksContainerId !== null && !disabledBookmarkActions));
	if(saveAction)
		localStorage.setItem("last_action", currentAction.toString());
}

function resetBookmarkContainer() {
	setBookmarkContainerInputEnabled(false);
	bookmarksContainerId = null;
	bookmarksFolderInput.value = "";
	localStorage.removeItem("bm_container");
	setBookmarkContainerInputEnabled(true);
}

function setBookmarkContainer() {
	setBookmarkContainerInputEnabled(false);
	chrome.bookmarks.search(bookmarksFolderInput.value, (results:any[]) => {
		if(results.length === 1) {
			if(results[0].url === undefined) { // Is a folder
				bookmarksContainerId = results[0].id;
				bookmarksFolderInput.value = results[0].title;
				localStorage.setItem("bm_container", bookmarksContainerId);
				setBookmarkContainerInputEnabled(true);
			} else {
				showError("Error: Can't find a folder with matching title");
				setBookmarkContainerInputEnabled(true);
			}
		} else {
			showError(
				results.length === 0 ?
				"Error: Can't find matching title" :
				"Error: Multiple bookmark entries match this title"
			);
			setBookmarkContainerInputEnabled(true);
		}
	});
}

let disabledBookmarkActions = false;
function setBookmarkContainerInputEnabled(enabled:boolean) {
	disabledBookmarkActions = !enabled;
	bookmarksFolderInput.disabled = !enabled;

	setElementEnabled(bookmarksSet, enabled);

	setVisibility(bookmarksReset, bookmarksContainerId !== null);
	
	setElementEnabled(bookmarksReset, enabled ? bookmarksContainerId !== null : false);

	setApplyToButtonsEnabled(!actions[currentAction].actionRequiresBookmarks || (enabled && bookmarksContainerId !== null));
}

setBookmarkContainerInputEnabled(false);

bookmarksContainerId = localStorage.getItem("bm_container");
if(bookmarksContainerId !== null) {
	chrome.bookmarks.get(bookmarksContainerId, (subTree:any[]) => {
		if(subTree.length === 1 && subTree[0].url === undefined) {
			bookmarksContainerId = subTree[0].id;
			bookmarksFolderInput.value = subTree[0].title;
		}
		setBookmarkContainerInputEnabled(true);
	});
} else {
	setBookmarkContainerInputEnabled(true);
}

{
	let lastAction:any = localStorage.getItem("last_action");
	if(lastAction === null) {
		pickAction(1, true);
	} else {
		lastAction = parseInt(lastAction);
		if(isNaN(lastAction) || lastAction < 0 || lastAction >= actions.length)
			pickAction(1, true);
		else
			pickAction(lastAction, false);
	}
}