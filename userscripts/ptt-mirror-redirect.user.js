// ==UserScript==
// @name         PTT Mirror Redirect
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  PTT 鏡像站（MoPTT、BePTT）文章網址自動轉址到 PTT 原文 www.ptt.cc/bbs/看板/文章ID.html
// @match        https://moptt.tw/p/*
// @match        https://bbs.beptt.tw/*
// @run-at       document-start
// @downloadURL  https://santosliu.github.io/userscripts/ptt-mirror-redirect.user.js
// @updateURL    https://santosliu.github.io/userscripts/ptt-mirror-redirect.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const m =
        // MoPTT：/p/看板.文章ID，看板名稱不含「.」
        location.pathname.match(/^\/p\/([^./]+)\.([^/]+)$/) ||
        // BePTT：/看板/文章ID，只比對文章 ID 格式，避免看板列表等頁面也被轉走
        (location.hostname === 'bbs.beptt.tw' && location.pathname.match(/^\/([^/]+)\/([MG]\.\d+\.A\.[0-9A-F]+)$/));
    if (m) {
        location.replace(`https://www.ptt.cc/bbs/${m[1]}/${m[2]}.html`);
    }
})();
