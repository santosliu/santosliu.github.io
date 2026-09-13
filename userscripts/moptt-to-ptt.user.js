// ==UserScript==
// @name         MoPTT to PTT
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  MoPTT 文章網址自動轉址到 PTT 原文（moptt.tw/p/看板.文章ID → www.ptt.cc/bbs/看板/文章ID.html）
// @match        https://moptt.tw/p/*
// @run-at       document-start
// @downloadURL  https://santosliu.github.io/userscripts/moptt-to-ptt.user.js
// @updateURL    https://santosliu.github.io/userscripts/moptt-to-ptt.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 看板名稱不含「.」，第一個點之後就是文章 ID（如 M.1789228674.A.8B4）
    const m = location.pathname.match(/^\/p\/([^./]+)\.([^/]+)$/);
    if (m) {
        location.replace(`https://www.ptt.cc/bbs/${m[1]}/${m[2]}.html`);
    }
})();
