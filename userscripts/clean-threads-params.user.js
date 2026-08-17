// ==UserScript==
// @name         Clean Threads URL Parameters (Dynamic)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @match        https://www.threads.net/*
// @match        https://www.threads.com/*
// @run-at       document-start
// @downloadURL  https://santosliu.github.io/userscripts/clean-threads-params.user.js
// @updateURL    https://santosliu.github.io/userscripts/clean-threads-params.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function cleanURL() {
        const url = new URL(window.location.href);
        let changed = false;

        // 定義你要刪除的參數列表
        const paramsToDelete = ['xmt', 'slof'];

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

    // 1. 網頁剛載入時檢查一次
    window.addEventListener('DOMContentLoaded', cleanURL);
    window.addEventListener('load', cleanURL);

    // 2. 監聽 URL 變化（針對單頁應用 SPA 如 Threads）
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

})();
