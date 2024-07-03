export type SplitRequest = {
  incognito: boolean
  tab_ids: number[]
}

declare global {
  const browser: unknown
}
const is_ff = typeof browser !== "undefined"

function create_context_menu(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "save_it",
      title: "Save It",
      contexts: ["link", "image", "video", "audio", "page", "frame"],
    })
  })
}

function notify(message: string): void {
  const props: chrome.notifications.NotificationOptions<true> = {
    isClickable: false,
    message,
    type: "basic",
    title: "QnEZ error!",
    iconUrl: "icon128.png",
  }
  if (!is_ff) {
    props.requireInteraction = true
    props.silent = false
  }
  chrome.notifications.create(props)
}

const enum Ext {
  SWF,

  APNG,

  MP4,
  WEBM,
  VIDEO,

  OGG,
  M4A,
  MP3,
  AUDIO,

  GIF,

  PNG,
  JPEG,
  AVIF,
  WEBP,
  IMAGE,

  UNKNOWN,
}

const url_exts = new Map([
  ["png", Ext.PNG],
  ["apng", Ext.APNG],
  ["gif", Ext.GIF],
  ["jpg", Ext.JPEG],
  ["jpeg", Ext.JPEG],
  ["jfif", Ext.JPEG],
  ["avif", Ext.AVIF],
  ["webp", Ext.WEBP],
  ["webm", Ext.WEBM],
  ["mp4", Ext.MP4],
  ["opus", Ext.OGG],
  ["ogg", Ext.OGG],
  ["m4a", Ext.M4A],
  ["mp3", Ext.MP3],
])

const mime_exts = new Map([
  ["audio", Ext.AUDIO],
  ["video", Ext.VIDEO],
  ["image", Ext.IMAGE],
])

function guess_by_header(content_type: string): Ext {
  const semi = content_type.lastIndexOf(";")
  if (semi !== -1) {
    content_type = content_type.slice(0, semi)
  }
  content_type = content_type.toLowerCase()
  let l, r
  const slash = content_type.indexOf("/")
  if (slash === -1) {
    l = r = content_type
  } else {
    l = content_type.slice(0, slash)
    r = content_type.slice(slash + 1)
  }
  return Math.min(mime_exts.get(l) ?? Ext.UNKNOWN, url_exts.get(r) ?? Ext.UNKNOWN)
}

function guess_by_url(url: string): Ext {
  try {
    url = new URL(url).pathname
  } catch (_) { /* NOOP */ }
  const idx = url.lastIndexOf(".")
  if (idx === -1) {
    return Ext.UNKNOWN
  }
  return url_exts.get(url.slice(idx + 1).toLowerCase()) ?? Ext.UNKNOWN
}

type Meta = [Ext, number, string]

async function fetch_media(url: string, referer: string | undefined): Promise<Meta> {
  try {
    const r = await fetch(url, {
      method: "HEAD",
      credentials: "include",
      cache: "force-cache",
      referrer: referer ?? "",
      referrerPolicy: "no-referrer-when-downgrade",
    })
    const url_ext = guess_by_url(r.url)
    const content_type = guess_by_header(r.headers.get("Content-Type") ?? "")
    let content_length = parseInt(r.headers.get("Content-Length")!)
    if (isNaN(content_length)) {
      content_length = 0
    }
    return [Math.min(url_ext, content_type), content_length, url]
  } catch (_) {
    return [Ext.UNKNOWN, 0, url]
  }
}

function better_meta(l: Meta, r: Meta): string {
  const [l_ext, l_size, l_string] = l
  const [r_ext, r_size, r_string] = r

  if (l_ext < r_ext) {
    return l_string
  }
  if (l_ext > r_ext) {
    return r_string
  }
  if (l_size > r_size) {
    return l_string
  }
  if (l_size < r_size) {
    return r_string
  }
  return l_string
}

// Context menu on click
function context_menu_click(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void {
  if (info.menuItemId !== "save_it") {
    return
  }

  void (async function() {
    let target: string
    if (info.srcUrl === undefined && info.linkUrl === undefined) {
      if (guess_by_url(tab?.url ?? "") >= Ext.UNKNOWN) {
        notify("Selected link isn't a media file")
        return
      }
      target = info.pageUrl
    } else if (info.srcUrl === undefined) {
      target = info.linkUrl!
    } else if (info.linkUrl === undefined || info.linkUrl === info.srcUrl) {
      target = info.srcUrl
    } else {
      const referer = tab?.url
      const [s, l] = await Promise.all([fetch_media(info.srcUrl, referer), fetch_media(info.linkUrl, referer)])
      target = better_meta(l, s)
    }

    void chrome.downloads.download({
      url: target,
      // TODO: "prompt" is not yet implemented in FF
      conflictAction: is_ff ? "uniquify" : "prompt",
      saveAs: false,
    })
  })()
}

// Receive commands
function on_command(command: string): void {
  switch (command) {
    case "discard_selected_tabs":
    case "bookmark_selected_tabs":
    case "bookmark_and_close_selected_tabs":
      break
    default:
      return
  }

  chrome.tabs.query({ currentWindow: true, highlighted: true }, (tabs) => {
    if (tabs.length === 0) { return }

    try {
      if (command === "discard_selected_tabs") {
        for (const tab of tabs) {
          if (!tab.discarded) {
            void chrome.tabs.discard(tab.id)
          }
        }
        return
      }

      let container_id = localStorage.getItem("bm_container")
      if (container_id !== null) {
        chrome.bookmarks.get(container_id, (sub_tree) => {
          if (sub_tree !== undefined && sub_tree.length === 1 && sub_tree[0].url === undefined) {
            container_id = sub_tree[0].id

            for (const tab of tabs) {
              void chrome.bookmarks.create({ parentId: container_id, title: tab.title, url: tab.url })
            }

            if (command === "bookmark_and_close_selected_tabs") {
              void chrome.tabs.remove(tabs.map((tab) => tab.id!))
            }
          } else {
            notify("QnEZ error: Failed to create bookmark, target folder is invalid or absent.")
          }
        })
      } else {
        notify("QnEZ error: Failed to create bookmark, target folder is invalid or absent.")
      }
    } catch (_) {
      notify("QnEZ error: Failed to complete the operation, something went wrong!")
    }
  })
}

// Split window message receiver
function on_message(request: SplitRequest): void {
  const options: chrome.windows.CreateData = { incognito: request.incognito, type: "normal" }

  if (!is_ff) {
    // TODO: "focused" is not implemented in FF
    options.focused = false
  }

  chrome.windows.create(options, (new_window) => {
    void chrome.tabs.move(request.tab_ids, { windowId: new_window!.id!, index: -1 })
  })
}

if (!chrome.contextMenus.onClicked.hasListener(context_menu_click)) {
  // Discard tabs
  chrome.runtime.onStartup.addListener(() => {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab !== undefined && !tab.discarded) {
          void chrome.tabs.discard(tab.id)
        }
      }
    })
  })
  // Create context menu
  create_context_menu()
  /*
  chrome.runtime.onInstalled.addListener(() => {
    createContextMenu();
  });
  */
  chrome.contextMenus.onClicked.addListener(context_menu_click)
  chrome.commands.onCommand.addListener(on_command)
  chrome.runtime.onMessage.addListener(on_message)
}
