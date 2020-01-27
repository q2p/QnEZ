const apply_to_left = document.getElementById("left");
const apply_to_right = document.getElementById("right");
const apply_to_left_and_right = document.getElementById("left_and_right");
const apply_to_selected = document.getElementById("selected");

interface ActionHolder {
	element:HTMLElement,
	action:(tabObjects:object[], tabIds:number[])=>void,
	action_requires_bookmarks:boolean,
	action_requires_tab_objects:boolean,
	action_requires_tab_ids:boolean
};
const actions:ActionHolder[] = [
	{
		element: document.getElementById("action_bookmark"),
		action: bookmark_tabs,
		action_requires_bookmarks: true,
		action_requires_tab_objects: true,
		action_requires_tab_ids: false
	},
	{
		element: document.getElementById("action_bookmark_and_close"),
		action: bookmark_and_close_tabs,
		action_requires_bookmarks: true,
		action_requires_tab_objects: true,
		action_requires_tab_ids: true
	},
	{
		element: document.getElementById("action_discard"),
		action: discard_tabs,
		action_requires_bookmarks: false,
		action_requires_tab_objects: true,
		action_requires_tab_ids: false
	},
	{
		element: document.getElementById("action_split_window"),
		action: split_window,
		action_requires_bookmarks: false,
		action_requires_tab_objects: true,
		action_requires_tab_ids: true
	}
];

for(let i = 0; i != actions.length; i++) {
	actions[i].element.addEventListener("click", () => { change_action(i); }, false);
}

let currentAction:number = 0;

const input_container:HTMLElement = document.getElementById("input_container");
const bookmarks_folder_input:HTMLInputElement = <HTMLInputElement> document.getElementById("bookmarks_folder");
const bookmarks_overlay:HTMLElement = document.getElementById("bookmarks_overlay");
const bookmarks_open_button:HTMLElement = document.getElementById("bookmarks_open_button");
const bookmarks_indicator:HTMLElement = document.getElementById("bookmarks_indicator");
const bookmarks_set:HTMLElement = document.getElementById("bookmarks_set");
const bookmarks_cancel:HTMLElement = document.getElementById("bookmarks_cancel");
let bookmarks_container_id:string = null;

bookmarks_set.addEventListener("click", set_bookmark_container, false);
bookmarks_open_button.addEventListener("click", open_bookmarks_menu, false);
bookmarks_cancel.addEventListener("click", close_bookmarks_menu, false);

function cant_exec() {
	return actions[currentAction].action_requires_bookmarks && (bookmarks_container_id === null || disabled_bookmark_actions);
}

function exec_on_LR(left:boolean, right:boolean):void {
	if(cant_exec())
		return;

	chrome.tabs.query({ currentWindow: true,  highlighted: true }, (tabs) => {
		if(tabs.length === 0)
			return;
		
		let slIdx = tabs[0].index;
		let srIdx = tabs[tabs.length-1].index;

		chrome.tabs.query({ currentWindow: true }, (tabs) => {
			let filteredTabs:object[] = [];
			let filteredTabIds:number[] = [];
			if(actions[currentAction].action_requires_tab_objects && actions[currentAction].action_requires_tab_ids) {
				for(let tab of tabs) {
					if(((left && tab.index < slIdx) || (right && tab.index > srIdx))) {
						filteredTabs.push(tab);
						filteredTabIds.push(tab.id);
					}
				}
			} else if(actions[currentAction].action_requires_tab_objects) {
				for(let tab of tabs)
					if(((left && tab.index < slIdx) || (right && tab.index > srIdx)))
						filteredTabs.push(tab);
			} else {
				for(let tab of tabs)
					if(((left && tab.index < slIdx) || (right && tab.index > srIdx)))
						filteredTabIds.push(tab.id);
			}
			actions[currentAction].action(filteredTabs, filteredTabIds);
		});
	});
}

function exec_on_selected():void {
	if(cant_exec())
		return;
	
	chrome.tabs.query({ currentWindow: true, highlighted: true }, (tabs) => {
		if(tabs.length === 0)
			return;
			
		let tabIds:number[] = [];
		if(actions[currentAction].action_requires_tab_ids) {
			for(let tab of tabs)
				tabIds.push(tab.id);
		}

		if(!actions[currentAction].action_requires_tab_objects)
			tabs.length = 0;
			
		actions[currentAction].action(tabs, tabIds);
	});
}

apply_to_left.addEventListener("click", () => exec_on_LR(true, false), false);
apply_to_right.addEventListener("click", () => exec_on_LR(false, true), false);
apply_to_left_and_right.addEventListener("click", () => exec_on_LR(true, true), false);
apply_to_selected.addEventListener("click", () => exec_on_selected(), false);

function set_apply_to_buttons_enabled(enabled:boolean) {
	set_element_enabled(apply_to_left, enabled);
	set_element_enabled(apply_to_right, enabled);
	set_element_enabled(apply_to_left_and_right, enabled);
	set_element_enabled(apply_to_selected, enabled);
}

set_apply_to_buttons_enabled(false);

function change_action(i:number) {
	if(currentAction !== i) {
		actions[currentAction].element.classList.remove("selected");
		init_action(i, true);
	}
}

function init_action(i:number, save:boolean) {
	actions[i].element.classList.add("selected");
	currentAction = i;
	set_apply_to_buttons_enabled(!actions[currentAction].action_requires_bookmarks || (bookmarks_container_id !== null && !disabled_bookmark_actions));
	if (save) {
		localStorage.setItem("last_action", currentAction.toString());
	}
}

function open_bookmarks_menu() {
	set_visibility(bookmarks_overlay, true);
}

function close_bookmarks_menu() {
	set_visibility(bookmarks_overlay, false);

	if (bookmarks_container_id === null) {
		bookmarks_folder_input.value = "";
	} else {
		bookmarks_folder_input.value = bookmarks_indicator.innerText;
	}

	input_container.classList.remove("error");
}

function set_bookmark_container() {
	set_bookmark_container_input_enabled(false);
	let value = bookmarks_folder_input.value;
	if (value.length === 0) {
		bookmarks_container_id = null;
		bookmarks_folder_input.value = "";
		bookmarks_indicator.innerText = "Not set";
		localStorage.removeItem("bm_container");
		close_bookmarks_menu();
		set_bookmark_container_input_enabled(true);
	} else {
		chrome.bookmarks.search(value, (results:any[]) => {
			if(results.length === 1) {
				if(results[0].url === undefined) { // Is a folder
					bookmarks_container_id = results[0].id;
					bookmarks_folder_input.value = results[0].title;
					bookmarks_indicator.innerText = results[0].title;
					localStorage.setItem("bm_container", bookmarks_container_id.toString());
					close_bookmarks_menu();
					set_bookmark_container_input_enabled(true);
				} else {
					showError("Error: Can't find a folder with a matching title");
					set_bookmark_container_input_enabled(true);
				}
			} else {
				showError(
					results.length === 0 ?
					"Error: Can't find a folder with a matching title" :
					"Error: Multiple bookmark entries match this title"
				);
				set_bookmark_container_input_enabled(true);
			}
		});
	}
}

let disabled_bookmark_actions = false;
function set_bookmark_container_input_enabled(enabled:boolean) {
	disabled_bookmark_actions = !enabled;
	bookmarks_folder_input.disabled = !enabled;

	set_element_enabled(bookmarks_set, enabled);

	set_apply_to_buttons_enabled((enabled && bookmarks_container_id !== null) || !actions[currentAction].action_requires_bookmarks);
}

function discard_all_tabs():void {
	chrome.tabs.query({ active: false }, (tabs) => {
		discard_tabs(tabs, []);
	});
}
document.getElementById('discard_all_tabs').addEventListener('click', discard_all_tabs, false);

const errorMessage:HTMLElement = document.getElementById('error_message');

function showError(message:string) {
	errorMessage.innerText = message;
	input_container.classList.add("error");
}

{
	set_bookmark_container_input_enabled(false);

	let bm_container = localStorage.getItem("bm_container");
	if(bm_container !== null) {
		try {
			chrome.bookmarks.get(bm_container, (sub_tree:any[]) => {
				if(sub_tree !== undefined && sub_tree.length === 1 && sub_tree[0].url === undefined) {
					bookmarks_container_id = sub_tree[0].id;
					bookmarks_folder_input.value = sub_tree[0].title;
					bookmarks_indicator.innerText = sub_tree[0].title;
				}
				set_bookmark_container_input_enabled(true);
			});
		} catch {
			set_bookmark_container_input_enabled(true);
		}
	} else {
		set_bookmark_container_input_enabled(true);
	}

	let last_action:any = localStorage.getItem("last_action");
	if(last_action === null) {
		init_action(1, true);
	} else {
		last_action = parseInt(last_action);
		if(isNaN(last_action) || last_action < 0 || last_action >= actions.length) {
			init_action(1, true);
		} else {
			init_action(last_action, false);
		}
	}
}