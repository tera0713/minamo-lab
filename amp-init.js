/* Amplitudeの計測を始める（Session Replay・Autocapture込み）
   config.js と、Amplitudeの2つのスクリプトを読み込んだ後に実行される */
(function () {
  'use strict';
  var key = window.AMP_API_KEY || '';
  var a = window.amplitude;
  if (!key || key.indexOf('YOUR_') === 0 || !a || !a.init) {
    if (window.console) {
      console.warn('[ミナモ検証ラボ] Amplitudeが動いていません。config.js のAPIキーと、ネットワークを確認してください');
    }
    return;
  }
  if (window.sessionReplay && window.sessionReplay.plugin) {
    a.add(window.sessionReplay.plugin({ sampleRate: 1 }));   // 検証用なので全セッションを記録する
  }
  a.init(key, {
    fetchRemoteConfig: true,
    autocapture: {
      attribution: true,             // URLのutm_…（流入元の印）を記録
      pageViews: true,
      sessions: true,
      formInteractions: true,
      elementInteractions: true,     // クリック（ヒートマップの材料）
      frustrationInteractions: true, // 連打（レイジクリック）・無反応クリック
      fileDownloads: false,
      networkTracking: false,        // イベント数を増やさないため切る
      webVitals: false
    }
  });
  // URLに ?uid=MNM0000123 のような練習用の会員IDがあれば、その人として記録する
  try {
    var uid = new URLSearchParams(window.location.search).get('uid');
    if (uid && /^MNM\d{7}$/.test(uid)) { a.setUserId(uid); }
  } catch (e) { /* 古いブラウザでは何もしない */ }
})();
