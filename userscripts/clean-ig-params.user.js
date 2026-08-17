// ==UserScript==
// @name         Clean Instagram Post URL Parameters
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Instagram 貼文網址自動移除問號後的所有參數（igsh、img_index 等）
// @match        https://www.instagram.com/*
// @run-at       document-start
// @downloadURL  https://santosliu.github.io/userscripts/clean-ig-params.user.js
// @updateURL    https://santosliu.github.io/userscripts/clean-ig-params.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const replaceState = history.replaceState.bind(history);

    // ponytail: 只清貼文網址，避免動到登入 ?next= 或搜尋 ?q= 之類必要參數
    function cleanURL() {
        if (location.search && /^\/(p|reel|reels|tv)\//.test(location.pathname)) {
            replaceState(history.state, '', location.pathname);
        }
    }

    // 注入當下立即清一次
    cleanURL();

    // IG 是 SPA，換頁時要再清一次
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        cleanURL();
    };

    window.addEventListener('popstate', cleanURL);
})();
