/* ミナモ検証ラボ：ページの動きと、Amplitudeへの記録
   イベント名は Snowflake のダミーデータと同じ「[サービス]アクション」の形にそろえている */
(function () {
  'use strict';

  /* ---------- 共通 ---------- */
  function getParam(name) {
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  }
  function remember(key, value) {
    try {
      if (value) { window.sessionStorage.setItem(key, value); }
      return window.sessionStorage.getItem(key);
    } catch (e) { return value || null; }
  }
  var campaignId = remember('minamo_cid', getParam('cid')) || window.MINAMO_DEFAULT_CAMPAIGN || 'CP-2610-WEB-06';
  var page = document.body.getAttribute('data-page') || '';

  function track(name, props) {
    var all = { '施策ID': campaignId, 'ページ': page, '接触チャネル': 'Web' };
    Object.keys(props || {}).forEach(function (k) { all[k] = props[k]; });
    if (window.amplitude && window.amplitude.track) { window.amplitude.track(name, all); }
    if (window.console) { console.log('[track]', name, all); }
  }
  window.minamoTrack = track;

  // 施策IDを、同じサイト内のリンクに引き継ぐ
  document.querySelectorAll('a[data-keep-cid]').forEach(function (a) {
    try {
      var url = new URL(a.getAttribute('href'), window.location.href);
      url.searchParams.set('cid', campaignId);
      a.setAttribute('href', url.pathname.split('/').pop() + url.search);
    } catch (e) { /* そのまま */ }
  });

  // data-track の付いた要素のクリックを記録する（リンクは記録してから移動する）
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest ? ev.target.closest('[data-track]') : null;
    if (!el) { return; }
    track(el.getAttribute('data-track'), { 'ボタン位置': el.getAttribute('data-place') || '' });
    var href = el.tagName === 'A' ? el.getAttribute('href') : null;
    if (href && !el.getAttribute('target')) {
      ev.preventDefault();
      window.setTimeout(function () { window.location.href = href; }, 250);
    }
  });

  function show(id) {
    document.querySelectorAll('[data-panel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-panel') !== id;
    });
    window.scrollTo(0, 0);
  }

  /* ---------- LP（index.html） ---------- */
  if (page === 'lp') {
    track('[ミナモPay]キャンペーン詳細表示');

    // #lottery-banner は、わざと何もしないボタン（無反応クリック＝デッドクリックの観察用）
    // 反応が遅いボタン（連打＝レイジクリックの観察用）
    var slow = document.getElementById('slow-button');
    if (slow) {
      slow.addEventListener('click', function () {
        slow.textContent = '混み合っています…';
        window.setTimeout(function () { slow.textContent = 'ポイント残高を確認する'; }, 3000);
      });
    }
  }

  /* ---------- エントリー（entry.html） ---------- */
  if (page === 'entry') {
    track('[ミナモPay]エントリー開始');
    var form = { memberId: '', method: '' };

    var next1 = document.getElementById('next-1');
    next1 && next1.addEventListener('click', function () {
      var input = document.getElementById('member-id');
      var err = document.getElementById('member-id-error');
      var v = (input.value || '').trim().toUpperCase();
      if (!/^MNM\d{7}$/.test(v)) {
        err.hidden = false;
        track('[ミナモPay]エントリー入力エラー', { 'ステップ番号': 1, '項目': '会員ID' });
        input.focus();
        return;
      }
      err.hidden = true;
      form.memberId = v;
      if (window.amplitude && window.amplitude.setUserId) { window.amplitude.setUserId(v); }   // ダミー会員とつなぐ
      track('[ミナモPay]エントリーステップ完了', { 'ステップ番号': 1, '総ステップ数': 3 });
      show('step-2');
    });

    var next2 = document.getElementById('next-2');
    next2 && next2.addEventListener('click', function () {
      var checked = document.querySelector('input[name="method"]:checked');
      var err = document.getElementById('method-error');
      if (!checked) {
        err.hidden = false;
        track('[ミナモPay]エントリー入力エラー', { 'ステップ番号': 2, '項目': '支払い方法' });
        return;
      }
      err.hidden = true;
      form.method = checked.value;
      document.getElementById('confirm-id').textContent = form.memberId;
      document.getElementById('confirm-method').textContent = form.method;
      track('[ミナモPay]エントリーステップ完了', { 'ステップ番号': 2, '総ステップ数': 3, '支払い方法': form.method });
      show('step-3');
    });

    document.querySelectorAll('[data-back]').forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-back')); });
    });

    var submit = document.getElementById('submit-entry');
    submit && submit.addEventListener('click', function () {
      var agree = document.getElementById('agree');
      var err = document.getElementById('agree-error');
      if (!agree.checked) {
        err.hidden = false;
        track('[ミナモPay]エントリー入力エラー', { 'ステップ番号': 3, '項目': '同意' });
        return;
      }
      err.hidden = true;
      track('[ミナモPay]エントリーステップ完了', { 'ステップ番号': 3, '総ステップ数': 3 });
      track('[ミナモPay]キャンペーンエントリー', { '支払い方法': form.method });
      show('done');
    });
  }

  /* ---------- 料金プラン診断（plan.html） ---------- */
  if (page === 'plan') {
    track('[ミナモモバイル]料金プラン画面表示');
    var PRICES = { 'ライト': '1,980円', 'スタンダード': '3,280円', 'オンライン専用': '2,970円', '無制限': '7,150円' };
    var chosen = '';

    var run = document.getElementById('run-diagnosis');
    run && run.addEventListener('click', function () {
      var usage = document.querySelector('input[name="usage"]:checked');
      var call = document.querySelector('input[name="call"]:checked');
      var shop = document.querySelector('input[name="shop"]:checked');
      var err = document.getElementById('plan-error');
      if (!usage || !call || !shop) {
        err.hidden = false;
        track('[ミナモモバイル]プラン診断入力エラー');
        return;
      }
      err.hidden = true;
      if (usage.value === '20GBを超える') { chosen = '無制限'; }
      else if (usage.value === '20GBまで') { chosen = shop.value === 'オンラインで完結したい' ? 'オンライン専用' : 'スタンダード'; }
      else { chosen = 'ライト'; }
      document.getElementById('result-plan').textContent = chosen;
      document.getElementById('result-price').textContent = '月額 ' + PRICES[chosen] + '（税込・架空）';
      track('[ミナモモバイル]プラン診断実行', {
        'データ使用量': usage.value, '通話': call.value, '手続き': shop.value, 'おすすめプラン': chosen
      });
      show('result');
    });

    var apply = document.getElementById('apply-plan');
    apply && apply.addEventListener('click', function () {
      track('[ミナモモバイル]プラン変更申込', { 'おすすめプラン': chosen });
      show('applied');
    });

    document.querySelectorAll('[data-back]').forEach(function (b) {
      b.addEventListener('click', function () { show(b.getAttribute('data-back')); });
    });
  }
})();
