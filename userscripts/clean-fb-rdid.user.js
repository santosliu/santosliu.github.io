// ==UserScript==
// @name         Clean Facebook rdid Parameter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @match        https://www.facebook.com/*
// @run-at       document-start
// @downloadURL  https://santosliu.github.io/userscripts/clean-fb-rdid.user.js
// @updateURL    https://santosliu.github.io/userscripts/clean-fb-rdid.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function cleanURL() {
        const url = new URL(window.location.href);
        let changed = false;

        // 檢查並移除 rdid 參數
        if (url.searchParams.has('rdid')) {
            url.searchParams.delete('rdid');
            changed = true;
        }

        // 如果網址有變更，用 replaceState 更新網址列而不重新整理頁面
        if (changed) {
            window.history.replaceState({}, '', url.toString());
        }
    }

    // 1. 頁面載入時檢查
    window.addEventListener('DOMContentLoaded', cleanURL);
    window.addEventListener('load', cleanURL);

    // 2. 攔截 Facebook 內部路由跳轉 (SPA)
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

    // 3. 額外防護：定時快速掃描（防範動態載入帶入參數）
    const observer = new MutationObserver(() => {
        const url = new URL(window.location.href);
        if (url.searchParams.has('rdid')) {
            cleanURL();
        }
    });

    observer.observe(document, { subtree: true, childList: true });

})();
