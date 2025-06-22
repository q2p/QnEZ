import type { SplitRequest } from "./background"

const apply_to_left = <HTMLButtonElement> document.getElementById("left")!
const apply_to_right = <HTMLButtonElement> document.getElementById("right")!
const apply_to_left_and_right = <HTMLButtonElement> document.getElementById("left_and_right")!
const apply_to_selected = <HTMLButtonElement> document.getElementById("selected")!

function split_window(tab_objects: chrome.tabs.Tab[], tab_ids: number[]): void {
  void chrome.runtime.sendMessage(<SplitRequest> {
    incognito: tab_objects[0].incognito,
    tab_ids,
  })
}
function discard_tabs(tab_objects: chrome.tabs.Tab[]): void {
  for (const tab of tab_objects) {
    if (!tab.discarded) {
      void chrome.tabs.discard(tab.id)
    }
  }
}
function bookmark_tabs(tab_objects: chrome.tabs.Tab[]): void {
  for (const tab of tab_objects) {
    void chrome.bookmarks.create({ parentId: bookmarks_container_id, title: tab.title, url: tab.url })
  }
}
function bookmark_and_close_tabs(tab_objects: chrome.tabs.Tab[], tab_ids: number[]): void {
  bookmark_tabs(tab_objects)
  void chrome.tabs.remove(tab_ids)
}

type ActionHolder = {
  element: HTMLElement
  action: (tabObjects: chrome.tabs.Tab[], tabIds: number[]) => void
  requires_bookmarks: boolean
  requires_tab_objects: boolean
  requires_tab_ids: boolean
}
const actions: ActionHolder[] = [
  {
    element: document.getElementById("action_bookmark")!,
    action: bookmark_tabs,
    requires_bookmarks: true,
    requires_tab_objects: true,
    requires_tab_ids: false,
  },
  {
    element: document.getElementById("action_bookmark_and_close")!,
    action: bookmark_and_close_tabs,
    requires_bookmarks: true,
    requires_tab_objects: true,
    requires_tab_ids: true,
  },
  {
    element: document.getElementById("action_discard")!,
    action: discard_tabs,
    requires_bookmarks: false,
    requires_tab_objects: true,
    requires_tab_ids: false,
  },
  {
    element: document.getElementById("action_split_window")!,
    action: split_window,
    requires_bookmarks: false,
    requires_tab_objects: true,
    requires_tab_ids: true,
  },
]

for (let i = 0; i !== actions.length; i++) {
  actions[i].element.addEventListener("click", () => { change_action(i) }, false)
}

let current_action = 0

const input_container = document.getElementById("input_container")!
const bookmarks_folder_input = <HTMLInputElement> document.getElementById("bookmarks_folder")!
const bookmarks_overlay = document.getElementById("bookmarks_overlay")!
const bookmarks_open_button = document.getElementById("bookmarks_open_button")!
const bookmarks_indicator = document.getElementById("bookmarks_indicator")!
const bookmarks_set = <HTMLButtonElement> document.getElementById("bookmarks_set")!
const bookmarks_cancel = document.getElementById("bookmarks_cancel")!

let bookmarks_container_id: string | undefined

bookmarks_set.addEventListener("click", set_bookmark_container, false)
bookmarks_open_button.addEventListener("click", open_bookmarks_menu, false)
bookmarks_cancel.addEventListener("click", close_bookmarks_menu, false)

function cant_exec(): boolean {
  return actions[current_action].requires_bookmarks && (bookmarks_container_id === undefined || disabled_bookmark_actions)
}

function exec_on_lr(left: boolean, right: boolean): void {
  if (cant_exec()) { return }

  chrome.tabs.query({ currentWindow: true, highlighted: true }, (tabs) => {
    if (tabs.length === 0) { return }

    const sl_idx = tabs[0].index
    const sr_idx = tabs[tabs.length - 1].index

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const filtered_tabs: chrome.tabs.Tab[] = []
      const filtered_tab_ids: number[] = []
      for (const tab of tabs) {
        if (tab.id !== undefined && tab.id >= 0 && ((left && tab.index < sl_idx) || (right && tab.index > sr_idx))) {
          if (actions[current_action].requires_tab_objects) {
            filtered_tabs.push(tab)
          }
          if (actions[current_action].requires_tab_ids) {
            filtered_tab_ids.push(tab.id)
          }
        }
      }
      actions[current_action].action(filtered_tabs, filtered_tab_ids)
    })
  })
}

function exec_on_selected(): void {
  if (cant_exec()) { return }

  chrome.tabs.query({ currentWindow: true, highlighted: true }, (tabs) => {
    if (tabs.length === 0) { return }

    const tab_ids: number[] = []
    if (actions[current_action].requires_tab_ids) {
      for (const tab of tabs) {
        if (tab.id !== undefined) {
          tab_ids.push(tab.id)
        }
      }
    }

    if (!actions[current_action].requires_tab_objects) { tabs.length = 0 }

    actions[current_action].action(tabs, tab_ids)
  })
}

apply_to_left.addEventListener("click", () => exec_on_lr(true, false), false)
apply_to_right.addEventListener("click", () => exec_on_lr(false, true), false)
apply_to_left_and_right.addEventListener("click", () => exec_on_lr(true, true), false)
apply_to_selected.addEventListener("click", () => exec_on_selected(), false)

function set_apply_to_buttons_enabled(enabled: boolean): void {
  set_element_enabled(apply_to_left, enabled)
  set_element_enabled(apply_to_right, enabled)
  set_element_enabled(apply_to_left_and_right, enabled)
  set_element_enabled(apply_to_selected, enabled)
}

set_apply_to_buttons_enabled(false)

function change_action(i: number): void {
  if (current_action !== i) {
    actions[current_action].element.classList.remove("selected")
    init_action(i, true)
  }
}

function init_action(i: number, save: boolean): void {
  actions[i].element.classList.add("selected")
  current_action = i
  set_apply_to_buttons_enabled(!actions[current_action].requires_bookmarks || (bookmarks_container_id !== null && !disabled_bookmark_actions))
  if (save) {
    void chrome.storage.local.set({ last_action: current_action })
  }
}

function open_bookmarks_menu(): void {
  set_visibility(bookmarks_overlay, true)
}

function close_bookmarks_menu(): void {
  set_visibility(bookmarks_overlay, false)

  if (bookmarks_container_id === undefined) {
    bookmarks_folder_input.value = ""
  } else {
    bookmarks_folder_input.value = bookmarks_indicator.innerText
  }

  input_container.classList.remove("error")
}

async function set_bookmark_container(): Promise<void> {
  set_bookmark_container_input_enabled(false)
  const value = bookmarks_folder_input.value
  if (value.length === 0) {
    bookmarks_container_id = undefined
    bookmarks_folder_input.value = ""
    bookmarks_indicator.innerText = "Not set"
    await chrome.storage.local.remove("bm_container")
    close_bookmarks_menu()
    set_bookmark_container_input_enabled(true)
  } else {
    const results = await chrome.bookmarks.search(value)
    if (results.length !== 1) {
      show_error(
        results.length === 0 ?
          "Error: Can't find a folder with a matching title" :
          "Error: Multiple bookmark entries match this title",
      )
    }
    if (results[0].url !== undefined) { // It's not a folder
      show_error("Error: Can't find a folder with a matching title")
    }
    bookmarks_container_id = results[0].id
    bookmarks_folder_input.value = results[0].title
    bookmarks_indicator.innerText = results[0].title
    await chrome.storage.local.set({ bm_container: bookmarks_container_id })
    close_bookmarks_menu()
    set_bookmark_container_input_enabled(true)
  }
}

let disabled_bookmark_actions = false
function set_bookmark_container_input_enabled(enabled: boolean): void {
  disabled_bookmark_actions = !enabled
  bookmarks_folder_input.disabled = !enabled

  set_element_enabled(bookmarks_set, enabled)

  set_apply_to_buttons_enabled((enabled && bookmarks_container_id !== null) || !actions[current_action].requires_bookmarks)
}

document.getElementById("discard_all_tabs")!.addEventListener("click", () => {
  chrome.tabs.query({ active: false }, discard_tabs)
}, false)

{
  function swap_remove<T>(arr: T[], idx: number): T {
    const last = arr.pop()!
    if (idx === arr.length) {
      return last
    }
    const ret = arr[idx]
    arr[idx] = last
    return ret
  }
  const shuffle_tabs = <HTMLButtonElement> document.getElementById("shuffle_tabs")!
  shuffle_tabs.addEventListener("click", async () => {
    set_element_enabled(shuffle_tabs, false)
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true })
      let i = 0
      while (tabs.length !== 0) {
        const r = Math.floor(Math.random() * tabs.length) % tabs.length
        const t = swap_remove(tabs, r)
        if (t.id === undefined || (chrome.tabGroups !== undefined && t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE)) {
          continue
        }
        await chrome.tabs.move(t.id, { index: i++ })
      }
    } finally {
      set_element_enabled(shuffle_tabs, true)
    }
  }, false)
}

async function get_dupes(): Promise<[Map<string, chrome.tabs.Tab[]>, number]> {
  const [tabs, windows] = await Promise.all([chrome.tabs.query({}), chrome.windows.getCurrent()])
  const focused_window = windows.id ?? -2
  const url_to_tabs = new Map<string, chrome.tabs.Tab[]>()
  for (const tab of tabs) {
    if (tab.url === undefined) {
      continue
    }
    let arr = url_to_tabs.get(tab.url)
    if (arr === undefined) {
      arr = []
      url_to_tabs.set(tab.url, arr)
    }
    arr.push(tab)
  }
  for (const k of url_to_tabs.keys()) {
    if (url_to_tabs.get(k)!.length < 2) {
      url_to_tabs.delete(k)
    }
  }
  return [url_to_tabs, focused_window]
}

{
  const close_dupes_btn = <HTMLButtonElement> document.getElementById("close_dupes")!
  close_dupes_btn.addEventListener("click", async () => {
    if (close_dupes_btn.disabled) {
      return
    }
    set_element_enabled(close_dupes_btn, false)
    try {
      const [tabs, focused_window] = await get_dupes()
      const sorted_tabs: chrome.tabs.Tab[] = []
      for (const duped_tabs of tabs.values()) {
        if (duped_tabs.some((t) => t.windowId !== focused_window)) {
          for (const tab of duped_tabs) {
            if (tab.windowId === focused_window) {
              sorted_tabs.push(tab)
            }
          }
        }
      }
      const promises: Array<Promise<void>> = []
      for (const tab of sorted_tabs) {
        if (tab.windowId === focused_window) {
          promises.push(chrome.tabs.remove(tab.id!))
        }
      }
      await Promise.all(promises)
    } finally {
      set_element_enabled(close_dupes_btn, true)
    }
  }, false)
}

{
  const show_dupes_btn = <HTMLButtonElement> document.getElementById("show_dupes")!
  show_dupes_btn.addEventListener("click", async () => {
    if (show_dupes_btn.disabled) {
      return
    }
    set_element_enabled(show_dupes_btn, false)
    try {
      const [tabs, focused_window] = await get_dupes()
      const sorted_tabs: chrome.tabs.Tab[] = []
      for (const tab of tabs.values()) {
        sorted_tabs.push(...tab)
      }
      sorted_tabs.sort((a, b) => {
        let diff = a.url!.localeCompare(b.url!)
        if (diff !== 0) {
          return diff
        }
        diff = a.windowId - b.windowId
        if (diff !== 0) {
          return diff
        }
        return (a.id ?? -2) - (b.id ?? -2)
      })
      let current_tab = sorted_tabs.length - 1
      for (let i = 0; i !== sorted_tabs.length; i++) {
        const tab = sorted_tabs[i]
        if (tab.windowId === focused_window && tab.active) {
          current_tab = i
        }
      }
      const next = sorted_tabs[(current_tab + 1) % sorted_tabs.length]
      await Promise.all([
        chrome.windows.update(next.windowId, { focused: true }),
        chrome.tabs.update(next.id!, { active: true, muted: true }),
      ])
    } finally {
      set_element_enabled(show_dupes_btn, true)
    }
  }, false)
}

function wipe_downloads(should_exist: boolean): (() => Promise<void>) {
  return async function(this: HTMLButtonElement) {
    if (this.disabled) {
      return
    }
    set_element_enabled(this, false)
    try {
      while ((await chrome.downloads.erase({
        totalBytesGreater: 0,
        paused: false,
        exists: should_exist,
        limit: 512,
        state: "complete",
      })).length !== 0) { /* NOOP */ }
    } finally {
      set_element_enabled(this, true)
    }
  }
}

document.getElementById("wipe_downloads_completed")!.addEventListener("click", wipe_downloads(true), false)

document.getElementById("wipe_downloads_deleted")!.addEventListener("click", wipe_downloads(false), false)

const error_message = document.getElementById("error_message")!

function show_error(message: string): void {
  error_message.innerText = message
  input_container.classList.add("error")
}

void (async () => {
  set_bookmark_container_input_enabled(false)

  const { bm_container } = await chrome.storage.local.get("bm_container")
  if (typeof bm_container === "string") {
    try {
      const sub_tree = await chrome.bookmarks.get(bm_container)
      if (sub_tree !== undefined && sub_tree.length === 1 && sub_tree[0].url === undefined) {
        bookmarks_container_id = sub_tree[0].id
        bookmarks_folder_input.value = sub_tree[0].title
        bookmarks_indicator.innerText = sub_tree[0].title
      }
    } catch { /* NOOP */ }
  }

  const { last_action } = await chrome.storage.local.get("last_action")
  if (typeof last_action !== "number" || last_action < 0 || last_action >= actions.length) {
    init_action(1, true)
  } else {
    init_action(last_action, false)
  }

  set_bookmark_container_input_enabled(true)
})()

function set_element_enabled(button: HTMLButtonElement, enabled: boolean): void {
  button.disabled = !enabled
  if (enabled) {
    button.classList.remove("disabled")
  } else {
    button.classList.add("disabled")
  }
}

function set_visibility(element: HTMLElement, visible: boolean): void {
  if (visible) {
    element.classList.remove("hidden")
  } else {
    element.classList.add("hidden")
  }
}
