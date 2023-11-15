import {DeepTestMsg} from "@/utils/types";
import {ActionRecordedMsg, ActionRecordEventAttach, ActionRecordStart, ScopeDeeptest} from "@/utils/const";
// import browser from "webextension-polyfill";

const master = new Map<number, number>()
let gMainWindowId = 0
let recorderWindowId = 0
const tabIdsInRecorderWindow = [0]

chrome.runtime.onInstalled.addListener(async (opt) => {
  if (opt.reason === 'install') {
    await chrome.storage.local.clear()

    // chrome.tabs.create({
    //   active: true,
    //   url: chrome.runtime.getURL('./installed.html'),
    // })
  }
})

chrome.runtime.onMessage.addListener(async (msg: DeepTestMsg, sender: chrome.runtime.MessageSender, sendResponse) => {
  const sendUrl = sender.tab?.url || ''
  const src = sender.tab ? `tab ${sendUrl}` : 'plugin popup'
  console.log(`--- deeptest background: get forward msg from ${src}`, msg)

  let tab = sender.tab
  if (!tab) { // from extension
    const tabs = await chrome.tabs.query({})

    tabs.forEach((item: object) => {
      console.log(item)
      if (item.url?.indexOf('http://localhost:8000') > -1) {
        tab = item
      }
    })
  }

  if (!tab) {
    console.log(`--- deeptest background: tab is null`)
    return
  }

  const act = msg.content?.act

  if (act === ActionRecordStart) {
    openRecordWindow(msg.content?.url, tab)
    sendResponse({message: "I am deeptest background: got your msg"})
  }
})

function openRecordWindow(url, tab) {
  console.log(`openRecordWindow`)

  const mainWindowId = tab.windowId
  gMainWindowId = mainWindowId

  console.log(`background script: mainWindowId = ${mainWindowId}`)

  const recorderWindowVal = master.get(recorderWindowId)
  if (recorderWindowVal) { // found, just to focus on
    chrome.windows.update(recorderWindowVal, {
      focused: true
    }).catch(function (e) {
      console.log(`background script: recorder window focused error`, e)

      master.set(recorderWindowVal, 0)
      openRecordWindow(url, tab)
    })

    console.log(`background script: main window focused success`)

    return
  }

  chrome.windows.create({
    url: url,
    type: 'popup',
    width: 1024,
    height: 800

  }).then(function (recorderWindowInfo) {
    console.log('waitRecorderWindowLoaded', recorderWindowInfo)

    return waitRecordWindowReady(recorderWindowInfo)

  }).then(function (recorderWindowInfo: object) {
    console.log('sendMsgToRecorderWindow', recorderWindowInfo)

    /* eslint-disable */
    const recorderWindowId = +recorderWindowInfo.id
    const recorderTabId = recorderWindowInfo.tabs.length > 0 ? +recorderWindowInfo.tabs[0].id : 0
    console.log(`background script: recorderWindowId = ${recorderWindowId}, recorderTabId = ${recorderTabId}`)

    // sendRecordEventAttachMsg(mainWindowId, recorderTabId)
    tabIdsInRecorderWindow.push(recorderTabId)

    setTimeout(function() {
      addTabsChangeEvent(mainWindowId, recorderWindowId)
      addRequestEvent(recorderTabId)
    }, 300)
  }).catch(function (e) {
    console.log(e)

  }).finally()
}

function waitRecordWindowReady(recorderWindowInfo: any) {
  return new Promise(function (resolve, reject) {
    let count = 0

    const interval = setInterval(function () {
      if (count > 50) {
        reject('background script: recorder window no response')
        clearInterval(interval)
      }

      /* eslint-disable */
      recorderWindowId = recorderWindowInfo.id || 0
      if (recorderWindowId) {
        chrome.tabs.query({
          windowId: recorderWindowId,
          active: true,
          status: "complete"
        })
            .then(function (tabs) {
              console.log(`background script: find tabs`, tabs)

              if (tabs.length != 1) {
                count++
                return
              } else {
                console.log(`background script: recorder window ${recorderWindowId} ready`)

                master.set(recorderWindowId, recorderWindowId)

                resolve(recorderWindowInfo)

                clearInterval(interval)
              }
            })
      }
    }, 300)
  })
}

// function sendRecordEventAttachMsg(mainWindowId: number, recorderTabId: number) {
//   chrome.tabs.sendMessage(recorderTabId, {
//     scope: ScopeDeeptest,
//     content: {
//       act: ActionRecordEventAttach,
//       mainWindowId: mainWindowId,
//       recorderWindowId: recorderWindowId,
//       recorderTabId: recorderTabId,
//     }
//   })
// }

function addTabsChangeEvent(mainWindowId: number, recorderWindowId: number) {
  chrome.tabs.onUpdated.addListener(
      function (tabId, changeInfo, tab) {
        console.log('tab updated', tabId, changeInfo, tab)

        if (tab.windowId !== recorderWindowId || changeInfo.status !== 'complete') return

        // const item = tabIdsInRecorderWindow.find((item)=>item === tabId)
        // if (item) return

        console.log('======== recorder tab completed', tabId)

        sendRecordEventAttachMsg(mainWindowId, tabId)
        tabIdsInRecorderWindow.push(tabId)
      }
  )
}

function addRequestEvent(recorderTabId: number) {
  console.log('=== background addRequestEvent', recorderTabId)

  // request recording event
  chrome.webRequest.onBeforeRequest.addListener(function(details){
      console.log('=== background onBeforeRequest', details)

      if (details.url.indexOf('http://') < 0 && details.url.indexOf('https://') < 0) {
        return
      }

      const msg = {
        scope: ScopeDeeptest,
        content: {
          act: ActionRecordedMsg,
          data: details
        }
      }

      sendRecordMessage(msg)

    },
    {
      urls: ['<all_urls>'],
      tabId: recorderTabId,
    },
    [
        'requestBody'
    ]
  )

  chrome.webRequest.onCompleted.addListener(
      function (details) {
        console.log('=== background onCompleted', details)

        if (details.url.indexOf('http://') < 0 && details.url.indexOf('https://') < 0) {
          return
        }

        const msg = {
          scope: ScopeDeeptest,
          content: {
            act: ActionRecordedMsg,
            data: details
          }
        }

        sendRecordMessage(msg)
      },

      {
        urls: ['<all_urls>'],
        tabId: recorderTabId
      }
  );
}

function sendRecordMessage(msg: any) {
  chrome.tabs.query({
    windowId: gMainWindowId,
    url: ['http://localhost:8000/*', 'https://deeptest.com/*'],
    active: true,
    status: "complete"
  }).then(function (tabs) {
      console.log(`background script: tabs found`, tabs)

      if (tabs.length > 0) {
        const tab = tabs[0]
        if (tab) {
          const scriptDesignTabId = tab.id ? +tab.id : 0
          void chrome.tabs.sendMessage(scriptDesignTabId, msg)
        }
      }
    }).catch((err) => {
      console.log(`background script: tabs NOT found`, err)
    })
}

console.log('hello world from background')

export {}