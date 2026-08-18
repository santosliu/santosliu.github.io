// ==UserScript==
// @name         Clean YouTube Playlist Parameters
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  移除 YouTube 影片網址的 list / start_radio / index 等播放清單參數
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @downloadURL  https://santosliu.github.io/userscripts/clean-youtube-list.user.js
// @updateURL    https://santosliu.github.io/userscripts/clean-youtube-list.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const paramsToDelete = ['list', 'start_radio', 'index', 'pp'];

    function cleanURL() {
        // 只處理影片頁；/playlist 等頁面的 list 是必要參數
        if (window.location.pathname !== '/watch') return;

        const url = new URL(window.location.href);
        let changed = false;

        paramsToDelete.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                changed = true;
            }
        });

        if (changed) {
            window.history.replaceState({}, '', url.toString());
        }
    }

    // 注入當下立即清一次（document-start 時網址已可讀，不等事件）
    cleanURL();

    window.addEventListener('DOMContentLoaded', cleanURL);
    window.addEventListener('load', cleanURL);

    // YouTube 是 SPA，換影片只會改 history 不會重載
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        cleanURL();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        cleanURL();
    };

    window.addEventListener('popstate', cleanURL);
    window.addEventListener('yt-navigate-finish', cleanURL);

})();
