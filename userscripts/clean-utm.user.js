// ==UserScript==
// @name         Auto Clean UTM and Tracking Parameters (All Sites)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @match        *://*/*
// @run-at       document-start
// @downloadURL  https://santosliu.github.io/userscripts/clean-utm.user.js
// @updateURL    https://santosliu.github.io/userscripts/clean-utm.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function cleanURL() {
        const url = new URL(window.location.href);
        let changed = false;

        // 收集所有需要刪除的參數
        const paramsToDelete = [];

        // 1. 自動檢查並抓出所有包含 utm_ 的參數（例如 utm_source, utm_medium...）
        // 2. 同時也可以順便把常見的追蹤碼（如 fbclid, gclid）加入
        const otherTrackers = ['fbclid', 'gclid', 'msclkid', '_openstat', 'rdid', 'xmt', 'slof'];

        url.searchParams.forEach((value, key) => {
            // 只要參數名稱是以 utm_ 開頭，或是落在常見追蹤清單內，就標記刪除
            if (key.toLowerCase().startsWith('utm_') || otherTrackers.includes(key.toLowerCase())) {
                paramsToDelete.push(key);
            }
        });

        // 執行刪除
        if (paramsToDelete.length > 0) {
            paramsToDelete.forEach(key => {
                url.searchParams.delete(key);
            });
            changed = true;
        }

        // 如果有清理，無縫更新網址列
        if (changed) {
            window.history.replaceState({}, '', url.toString());
        }
    }

    // 注入當下立即清一次（document-start 時網址已可讀，不等事件）
    cleanURL();

    // 頁面載入時檢查
    window.addEventListener('DOMContentLoaded', cleanURL);
    window.addEventListener('load', cleanURL);

    // 支援 SPA 單頁應用跳轉攔截
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
