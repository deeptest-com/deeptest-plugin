import type {DeepTestMsg} from '../../utils/types'
import {ActionRecordStart, ScopeDeeptest} from "../../utils/const"

export function addWindowListener() {
  window.addEventListener("message", function(event: MessageEvent<DeepTestMsg>) {
    console.log('--- deeptest content: got msg from deeptest page', event.data)

    if (event.source != window) { // only accept messages from this window to itself
      return
    }

    if (event.data.scope === ScopeDeeptest && event.data.content.act === ActionRecordStart) {
      const msg  = event.data
      console.log('--- deeptest content: forward msg to plugin background', msg)

      chrome.runtime.sendMessage(msg, function(resp) {
        console.log('--- deeptest content: forward msg response is ', resp)
      })
    }
  }, false)
}
