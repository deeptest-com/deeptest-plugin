<template>
  <div class="popup-main">
    <div class="record">
      <input type="text" placeholder="输入被录制网站的地址"
             v-model="url" /> &nbsp;
      <a href="#" style="cursor: pointer;"
         @click="startRecord">Start Record</a>
    </div>
    <br />
    <div>
      <a href="#" style="cursor: pointer;"
         @click="onOpenOptions">Open Options</a>
      &nbsp;&nbsp;&nbsp;
      <RouterLink to="/about">About</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import browser from "webextension-polyfill";
import {ActionRecordStart, ScopeDeeptest} from "@/utils/const";

const url = ref('http://111.231.16.35:9000/forms/post')

const startRecord = () => {
  console.log('startRecord')

  const data = {
    scope: ScopeDeeptest,
    content: {
      act: ActionRecordStart,
      url: url.value
    }
  }
  chrome.runtime.sendMessage(data, resp => {
    console.log(resp)
  })

  // browser.windows.create({
  //   url: url.value,
  //   type: 'popup',
  //   width: 1024,
  //   height: 800
  // })
}

const onOpenOptions = () => {
  console.log('onOpenOptions')
  browser.tabs.create({
    // This is for chrome-extension tab
    // url: 'chrome://extensions/?options=' + browser.runtime.id
    // This is for new tab
    url: `chrome-extension://${browser.runtime.id}/src/options/index.html`
  })

  // for chrome only
  // chrome.tabs.create({
  //   url: `chrome-extension://${browser.runtime.id}/src/options/index.html`
  // })
}

// chrome.identity.launchWebAuthFlow(
//   {
//     interactive: true,
//     url:
//       `https://github.com/login/oauth/authorize` +
//       `?client_id=55e294602d71eb006dc505540cf0614d6b3c7f35` +
//       `&redirect_uri=https://ekgmcbpgglflmgcfajnglpbcbdccnnje.chromiumapp.org/github_cb` +
//       `&scope=user.email`,
//   },
//   (a) => {
//     console.log(a)
//   }
// )
</script>

<style scoped>
.popup-main .record input {
  width: 260px;
}
</style>
