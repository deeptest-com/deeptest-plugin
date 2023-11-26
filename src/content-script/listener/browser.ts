import browser from 'webextension-polyfill'
import type {DeepTestMsg} from '../../utils/types'
import {ActionRecordedMsg, ChromeExtEventName, ChromeExtEventNodeId, ScopeDeeptest} from "../../utils/const"

let canvas: HTMLCanvasElement

export function addBrowserListener() {
  browser.runtime.onMessage.addListener(function contentWindowIdListener(message: DeepTestMsg) {
    console.log(`--- plugin content: contentWindowIdListener get msg`, message)

    if (message.scope != ScopeDeeptest) {
      return
    }

    if (message.content.act === ActionRecordedMsg) { // DeepTest script edit page receive recorded data
      // if (!canvas) {
      //   canvas = document.createElement("canvas")
      //   document.body.appendChild(canvas)
      // }

      fireEvent(ChromeExtEventName, ChromeExtEventNodeId, message.content.data)
    }
  })
}

export function fireEvent(eventName: string, eventNode: string, data: object): void {
    const eventFromChrome = new CustomEvent(eventName, {
        detail: data
    });

    const node = document.getElementById(eventNode)
    if (node) {
        // node.innerHTML += JSON.stringify(data) + '<br /><br />'
        node.dispatchEvent(eventFromChrome)
    }
}