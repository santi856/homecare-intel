/* HomeCare Intel — support chat widget.
   Self-contained vanilla JS: injects its own CSS and DOM, no dependencies.
   Answers from the approved HomeCare Intel answer bank; anything it cannot
   answer is routed to Jesse directly at (838) 304-3003. */
(function () {
  'use strict';
  if (window.__hciChatLoaded) return;
  window.__hciChatLoaded = true;

  var PHONE_DISPLAY = '(838) 304-3003';
  var EMAIL = 'jesusasantiago413@gmail.com';
  var DFY_LINK = 'https://buy.stripe.com/28EaEY0GGehC2c1bUT9AA02';
  var DIY_LINK = 'https://buy.stripe.com/14AbJ29dc2yU4k96Az9AA01';
  var SAMPLE_MAILTO = 'mailto:jesusasantiago413@gmail.com?subject=Send%20me%20the%20free%20Florida%20sample';
  var PARTNER_MAILTO = 'mailto:jesusasantiago413@gmail.com?subject=Partnership%20with%20HomeCare%20Intel';
  var ALLACCESS_MAILTO = 'https://buy.stripe.com/7sYeVe3SSb5qeYN6Az9AA08';

  var CSS = [
    '.hci-launcher{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom));z-index:99998;background:#087c5c;color:#fff;border:0;border-radius:999px;padding:13px 20px;font:600 15px/1.2 "DM Sans",system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 30px rgba(16,33,27,.28);transition:background .15s ease,transform .15s ease}',
    '.hci-launcher:hover{background:#056348}',
    '.hci-launcher:focus-visible{outline:3px solid #b6f048;outline-offset:2px}',
    '.hci-panel{position:fixed;right:20px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:99999;width:min(92vw,380px);height:min(600px,calc(100dvh - 120px));display:none;flex-direction:column;background:#fff;color:#10211b;border:1px solid #cbd8d3;border-radius:18px;box-shadow:0 24px 60px rgba(20,55,43,.22);overflow:hidden;font-family:"DM Sans",system-ui,sans-serif}',
    '.hci-panel.hci-open{display:flex}',
    '.hci-head{display:flex;gap:10px;align-items:flex-start;padding:14px 16px;background:#eaf0ee;border-bottom:1px solid #cbd8d3}',
    '.hci-head-text{flex:1;display:flex;flex-direction:column;gap:2px}',
    '.hci-head-text strong{font-size:15px;line-height:1.3}',
    '.hci-head-text span{font-size:12.5px;line-height:1.4;color:#50655d}',
    '.hci-close{background:transparent;border:0;color:#50655d;font-size:22px;line-height:1;cursor:pointer;padding:2px 4px;border-radius:8px}',
    '.hci-close:hover{color:#10211b}',
    '.hci-close:focus-visible{outline:2px solid #087c5c;outline-offset:1px}',
    '.hci-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f4f7f6}',
    '.hci-msg{max-width:88%;padding:10px 13px;border-radius:14px;font-size:14.5px;line-height:1.5;white-space:normal;word-wrap:break-word}',
    '.hci-msg.hci-bot{background:#fff;border:1px solid #cbd8d3;border-bottom-left-radius:4px;align-self:flex-start}',
    '.hci-msg.hci-user{background:#087c5c;color:#fff;border-bottom-right-radius:4px;align-self:flex-end}',
    '.hci-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
    '.hci-btn{display:inline-block;padding:8px 14px;border-radius:999px;background:#087c5c;color:#fff;text-decoration:none;font:600 13.5px/1.2 "DM Sans",system-ui,sans-serif}',
    '.hci-btn:hover{background:#056348}',
    '.hci-btn.hci-btn-alt{background:transparent;color:#087c5c;border:1px solid #087c5c}',
    '.hci-btn.hci-btn-alt:hover{background:#d9f0e7}',
    '.hci-chips{display:flex;flex-wrap:wrap;gap:7px;padding:10px 12px 2px;background:#fff}',
    '.hci-chip{border:1px solid #aebfb9;background:#fff;color:#10211b;border-radius:999px;padding:6px 12px;font:500 13px/1.2 "DM Sans",system-ui,sans-serif;cursor:pointer}',
    '.hci-chip:hover{border-color:#087c5c;color:#087c5c}',
    '.hci-chip:focus-visible{outline:2px solid #087c5c;outline-offset:1px}',
    '.hci-form{display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#fff;border-top:1px solid #cbd8d3}',
    '.hci-input{flex:1;min-width:0;padding:10px 14px;border:1px solid #aebfb9;border-radius:999px;font:400 14.5px/1.3 "DM Sans",system-ui,sans-serif;background:#fff;color:#10211b}',
    '.hci-input:focus{outline:2px solid #087c5c;outline-offset:0;border-color:#087c5c}',
    '.hci-send{background:#087c5c;color:#fff;border:0;border-radius:999px;padding:10px 16px;font:600 14px/1.2 "DM Sans",system-ui,sans-serif;cursor:pointer}',
    '.hci-send:hover{background:#056348}',
    '.hci-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '@media (prefers-color-scheme: dark){',
    '.hci-panel{background:#0d1b16;color:#edf8f4;border-color:#244338;box-shadow:0 24px 70px rgba(0,0,0,.5)}',
    '.hci-head{background:#12251e;border-bottom-color:#244338}',
    '.hci-head-text span{color:#a2b8af}',
    '.hci-close{color:#a2b8af}.hci-close:hover{color:#edf8f4}',
    '.hci-log{background:#07110e}',
    '.hci-msg.hci-bot{background:#0d1b16;border-color:#244338}',
    '.hci-msg.hci-user{background:#4cdbab;color:#06100d}',
    '.hci-launcher{background:#4cdbab;color:#06100d}.hci-launcher:hover{background:#76e8c1}',
    '.hci-btn{background:#4cdbab;color:#06100d}.hci-btn:hover{background:#76e8c1}',
    '.hci-btn.hci-btn-alt{background:transparent;color:#4cdbab;border-color:#4cdbab}.hci-btn.hci-btn-alt:hover{background:#143c30}',
    '.hci-chips{background:#0d1b16}',
    '.hci-chip{background:#0d1b16;color:#edf8f4;border-color:#365b4e}.hci-chip:hover{border-color:#4cdbab;color:#4cdbab}',
    '.hci-form{background:#0d1b16;border-top-color:#244338}',
    '.hci-input{background:#0d1b16;color:#edf8f4;border-color:#365b4e}.hci-input:focus{outline-color:#4cdbab;border-color:#4cdbab}',
    '.hci-send{background:#4cdbab;color:#06100d}.hci-send:hover{background:#76e8c1}',
    '}',
    '@media (max-width:480px){.hci-panel{right:10px;bottom:calc(76px + env(safe-area-inset-bottom))}.hci-launcher{right:14px}}'
  ].join('\n');

  function buildDom() {
    var style = document.createElement('style');
    style.setAttribute('data-hci-chat', '');
    style.textContent = CSS;
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<button type="button" class="hci-launcher" id="hci-launcher" aria-haspopup="dialog" aria-expanded="false" aria-controls="hci-panel">Questions? Ask us</button>' +
      '<div class="hci-panel" id="hci-panel" role="dialog" aria-label="HomeCare Intel chat">' +
        '<div class="hci-head">' +
          '<div class="hci-head-text">' +
            '<strong>HomeCare Intel \u2014 ask anything</strong>' +
            '<span>Real answers, instantly. For a human: call or text ' + PHONE_DISPLAY + '.</span>' +
          '</div>' +
          '<button type="button" class="hci-close" id="hci-close" aria-label="Close chat">&times;</button>' +
        '</div>' +
        '<div class="hci-log" id="hci-log" aria-live="polite"></div>' +
        '<div class="hci-chips" id="hci-chips" role="group" aria-label="Quick questions"></div>' +
        '<form class="hci-form" id="hci-form">' +
          '<label class="hci-sr" for="hci-input">Type your question</label>' +
          '<input class="hci-input" id="hci-input" type="text" autocomplete="off" placeholder="Ask about pricing, coverage, the sample\u2026" />' +
          '<button class="hci-send" type="submit">Send</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(wrap);
    return {
      launcher: document.getElementById('hci-launcher'),
      panel: document.getElementById('hci-panel'),
      closeBtn: document.getElementById('hci-close'),
      log: document.getElementById('hci-log'),
      chips: document.getElementById('hci-chips'),
      form: document.getElementById('hci-form'),
      input: document.getElementById('hci-input')
    };
  }

  /* ---- Approved answer bank ------------------------------------------- */
  var STATES = [
    { name: 'Florida', count: 102, page: 'homecare-intel-florida.html' },
    { name: 'Texas', count: 126, page: 'texas.html' },
    { name: 'California', count: 111, page: 'california.html' },
    { name: 'New York', count: 114, page: 'new-york.html' },
    { name: 'Pennsylvania', count: 110, page: 'pennsylvania.html' },
    { name: 'Ohio', count: 122, page: 'ohio.html' },
    { name: 'Washington', count: 123, page: 'washington.html' },
    { name: 'Illinois', count: 111, page: 'illinois.html' },
    { name: 'Arizona', count: 107, page: 'arizona.html' },
    { name: 'North Carolina', count: 119, page: 'north-carolina.html' },
    { name: 'Georgia', count: 224, page: 'georgia.html' },
    { name: 'Massachusetts', count: 123, page: 'massachusetts.html' },
    { name: 'Virginia', count: 129, page: 'virginia.html' },
    { name: 'New Jersey', count: 120, page: 'new-jersey.html' },
    { name: 'Michigan', count: 118, page: 'michigan.html' },
    { name: 'Tennessee', count: 120, page: 'tennessee.html' },
    { name: 'Missouri', count: 122, page: 'missouri.html' },
    { name: 'Maryland', count: 151, page: 'maryland.html' },
    { name: 'Wisconsin', count: 116, page: 'wisconsin.html' },
    { name: 'Minnesota', count: 105, page: 'minnesota.html' },
    { name: 'Colorado', count: 116, page: 'colorado.html' }
  ];

  function howHref() {
    return document.getElementById('how-to-use') ? '#how-to-use' : 'index.html#how-to-use';
  }

  function btn(label, href, alt) {
    return { label: label, href: href, alt: !!alt };
  }

  var ANSWERS = {
    price: function () {
      return {
        text: 'Two ways in.\n' +
          'Done-For-You is $800/mo: we email the owners in your market, work every reply, and book calls on your calendar. The full database is included, and zero positive replies in month one means month two is free.\n' +
          'Do-It-Yourself is $299/mo: the scored database for any 3 states you choose \u2014 owners, direct phones, licenses, scores. Add a state anytime for $75/mo, or take every live state with All-Access at $499/mo \u2014 message us to start that one. Verified owner emails are DFY-only.\n' +
          'Both are month-to-month, cancel anytime, and the rate you start at never goes up.',
        buttons: [btn('Start DFY \u2014 $800/mo', DFY_LINK), btn('Get the database \u2014 $299/mo', DIY_LINK, true)]
      };
    },
    allaccess: function () {
      return {
        text: 'All-Access is $499/mo: the scored database for every live state \u2014 21 today, and every new state as it is verified, at no extra cost.\n' +
          'DIY at $299/mo covers any 3 states you choose, and you can add a state anytime for $75/mo. Verified owner emails are DFY-only on both.\n' +
          'All-Access starts with a message to us \u2014 hit the button and we will set you up.',
        buttons: [btn('Subscribe to All-Access — $499/mo', ALLACCESS_MAILTO), btn('Get DIY \u2014 $299/mo (3 states)', DIY_LINK, true)]
      };
    },
    how: function () {
      return {
        text: 'Here is the whole job.\n' +
          'Done-For-You: 1) You pick your market and tell us who you sell to. 2) You approve the outreach angle \u2014 nothing sends until you say go. 3) We email the owners and work every reply; every reply is forwarded to you the same day it lands. 4) Owners who raise a hand get booked on your calendar, and you get a weekly report \u2014 sent, replies, booked.\n' +
          'Do-It-Yourself: your state files land in your inbox today. Sort by score, work the HOT rows first, get your Hot 10 for your states every Monday and fresh, re-verified files on the 1st.',
        buttons: [btn('See how it works', howHref())]
      };
    },
    sample: function () {
      return {
        text: 'The free sample is 25 real rows from the live Florida file \u2014 owners, direct phones, ratings, scores, the whole shape of the product. No card, no catch.\n' +
          'Hit the button and it opens an email to us; the sample comes straight back to your inbox.',
        buttons: [btn('Email me the free sample', SAMPLE_MAILTO)]
      };
    },
    coverage: function () {
      return {
        text: '21 states are live \u2014 2,589 agencies tracked: Florida, Texas, California, New York, Pennsylvania, Ohio, Washington, Illinois, Arizona, North Carolina, Georgia, Massachusetts, Virginia, New Jersey, Michigan, Tennessee, Missouri, Maryland, Wisconsin, Minnesota, and Colorado.\n' +
          'More states are in build and added only once verified. A paying DFY client\u2019s market jumps the build queue.',
        buttons: [btn('See the Florida data', 'homecare-intel-florida.html'), btn('See the Texas data', 'texas.html', true)]
      };
    },
    guarantee: function () {
      return {
        text: 'Straightforward: if month one of Done-For-You produces zero positive replies, month two is free.\n' +
          'And every reply your outreach gets is forwarded to you the same day it lands \u2014 good or bad, you see everything we see.',
        buttons: [btn('Start DFY \u2014 $800/mo', DFY_LINK)]
      };
    },
    inside: function () {
      return {
        text: 'Every record carries: agency name, owner or administrator, direct phone, address, website, license number, Google rating and review count, Instagram presence, online-booking signal, and a priority score with the plain-English reason behind it.\n' +
          'Verified owner emails sit in the enriched data \u2014 that is the DFY tier, or a $399 one-off file if you only want the emails once.',
        buttons: [btn('Get the free sample', SAMPLE_MAILTO), btn('Get the database \u2014 $299/mo', DIY_LINK, true)]
      };
    },
    fresh: function () {
      return {
        text: 'The database is re-verified monthly \u2014 fresh files for your states land on the 1st.\n' +
          'Every Monday you also get the Hot 10 for your states: the ten best-timed agencies that week \u2014 new licenses, rating drops, new openings.',
        buttons: [btn('Email me the free sample', SAMPLE_MAILTO)]
      };
    },
    cancel: function () {
      return {
        text: 'Cancel anytime. Just reply to any email from us and it is handled \u2014 no hassle, no retention call, no contract.\n' +
          'While you are subscribed, your rate is locked: it never goes up on you.',
        buttons: []
      };
    },
    partner: function () {
      return {
        text: 'Partners earn 25% of Done-For-You revenue for the life of the client, and 10% on the DIY database. The DFY setup fee is waived for partner referrals.\n' +
          'Full terms are on the partners page, or email us and we will walk you through it.',
        buttons: [btn('See partner terms', 'partners.html'), btn('Email us about partnering', PARTNER_MAILTO, true)]
      };
    },
    support: function () {
      return {
        text: 'Support is Jesse directly \u2014 no ticket queue. Call or text ' + PHONE_DISPLAY + ', or email ' + EMAIL + ' and it gets worked today.',
        buttons: [btn('Call ' + PHONE_DISPLAY, 'tel:+18383043003'), btn('Text', 'sms:+18383043003', true), btn('Email', 'mailto:' + EMAIL, true)]
      };
    },
    greeting: function () {
      return {
        text: 'Hey \u2014 happy to help. Ask me about pricing, how it works, coverage, or the guarantee \u2014 or grab the free sample and see the product itself.',
        buttons: [btn('Email me the free sample', SAMPLE_MAILTO)]
      };
    },
    thanks: function () {
      return {
        text: 'Anytime. If anything else comes up, ask here \u2014 or call or text Jesse at ' + PHONE_DISPLAY + '.',
        buttons: []
      };
    },
    fallback: function () {
      return {
        text: 'I want to get that right \u2014 that is one for Jesse directly: call or text ' + PHONE_DISPLAY + ', or email ' + EMAIL + ' and it gets worked today.\n' +
          'Meanwhile, the free sample shows the whole product:',
        buttons: [btn('Email me the free sample', SAMPLE_MAILTO), btn('Call ' + PHONE_DISPLAY, 'tel:+18383043003', true)]
      };
    }
  };

  function stateAnswer(state) {
    var buttons = [btn('See the ' + state.name + ' data', state.page), btn('Start DFY \u2014 $800/mo', DFY_LINK, true)];
    if (state.name === 'Florida') {
      buttons.push(btn('Email me the free sample', SAMPLE_MAILTO, true));
    }
    return {
      text: 'Yes \u2014 ' + state.name + ' is live: ' + state.count + ' agencies tracked, each scored with owner, direct phone, license, rating, and the reason it made the list.',
      buttons: buttons
    };
  }

  function includesAny(text, words) {
    for (var i = 0; i < words.length; i++) {
      if (text.indexOf(words[i]) !== -1) return true;
    }
    return false;
  }

  function matchIntent(raw) {
    var text = ' ' + raw.toLowerCase().replace(/[^a-z0-9$ ]+/g, ' ').replace(/\s+/g, ' ') + ' ';

    for (var i = 0; i < STATES.length; i++) {
      if (text.indexOf(' ' + STATES[i].name.toLowerCase() + ' ') !== -1) {
        return { intent: 'state', state: STATES[i] };
      }
    }
    if (includesAny(text, ['cancel', 'unsubscribe', 'month to month', 'month-to-month', 'contract', 'locked in', 'commitment'])) return { intent: 'cancel' };
    if (includesAny(text, ['partner', 'affiliate', 'referral', 'commission', 'resell', 'revenue share'])) return { intent: 'partner' };
    if (includesAny(text, ['sample', 'free sample', 'preview', 'try it', 'demo'])) return { intent: 'sample' };
    if (includesAny(text, ['guarantee', 'month two free', 'no replies', 'zero replies', 'what if it doesn', 'what happens if'])) return { intent: 'guarantee' };
    if (includesAny(text, ['include', 'fields', 'columns', 'what do i get', 'whats in', 'what is in', 'emails included', 'owner email', 'data points'])) return { intent: 'inside' };
    if (includesAny(text, ['fresh', 'updated', 'update', 'current', 'stale', 'how often', 'accurate', 'accuracy', 'verified'])) return { intent: 'fresh' };
    if (includesAny(text, ['all-access', 'all access', 'every state', 'all the states', 'whole map', 'entire map'])) return { intent: 'allaccess' };
    if (includesAny(text, ['price', 'pricing', 'cost', 'how much', '$', 'rate', 'expensive', 'charge', 'sign up', 'signup', 'subscribe', 'buy', 'get started', 'checkout', 'order'])) return { intent: 'price' };
    if (includesAny(text, ['how does', 'how it works', 'how do i', 'how to', 'how the', 'process', 'steps', 'walkthrough', 'walk me', 'use it', 'using it', 'works'])) return { intent: 'how' };
    if (includesAny(text, ['coverage', 'states', 'covered', 'where', 'locations', 'available in', 'which state'])) return { intent: 'coverage' };
    if (includesAny(text, ['support', 'human', 'real person', 'talk to', 'call me', 'phone', 'contact', 'representative', 'someone real']) || /\bhelp\b/.test(text) || /\bagent\b/.test(text)) return { intent: 'support' };
    if (/^\s*(hi|hello|hey|yo|good morning|good afternoon)\b/.test(raw.toLowerCase())) return { intent: 'greeting' };
    if (includesAny(text, ['thank', 'thanks'])) return { intent: 'thanks' };
    return { intent: 'fallback' };
  }

  /* ---- Chat behaviour -------------------------------------------------- */
  var CHIPS = [
    { label: 'Pricing', intent: 'price' },
    { label: 'How it works', intent: 'how' },
    { label: 'Free sample', intent: 'sample' },
    { label: 'Coverage', intent: 'coverage' },
    { label: 'Guarantee', intent: 'guarantee' },
    { label: 'Talk to support', intent: 'support' }
  ];

  var OPENING = 'Hey \u2014 this is the HomeCare Intel assistant. I can walk you through pricing, how it works, coverage, and the guarantee, send you the free sample, or take you straight to checkout. What do you need?';

  function init() {
    var els = buildDom();
    var opened = false;

    function scrollLog() {
      els.log.scrollTop = els.log.scrollHeight;
    }

    function addMessage(text, who, buttons) {
      var bubble = document.createElement('div');
      bubble.className = 'hci-msg ' + (who === 'user' ? 'hci-user' : 'hci-bot');
      var lines = String(text).split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (i > 0) bubble.appendChild(document.createElement('br'));
        bubble.appendChild(document.createTextNode(lines[i]));
      }
      if (buttons && buttons.length) {
        var row = document.createElement('div');
        row.className = 'hci-actions';
        buttons.forEach(function (b) {
          var a = document.createElement('a');
          a.className = 'hci-btn' + (b.alt ? ' hci-btn-alt' : '');
          a.textContent = b.label;
          a.href = b.href;
          if (/^https?:/i.test(b.href)) {
            a.target = '_blank';
            a.rel = 'noopener';
          }
          if (b.href.charAt(0) === '#') {
            a.addEventListener('click', function () { closePanel(); });
          }
          row.appendChild(a);
        });
        bubble.appendChild(row);
      }
      els.log.appendChild(bubble);
      scrollLog();
    }

    function respond(intentName, state) {
      var answer = intentName === 'state' ? stateAnswer(state) : ANSWERS[intentName]();
      window.setTimeout(function () {
        addMessage(answer.text, 'bot', answer.buttons);
      }, 220);
    }

    function handleUserText(raw) {
      var text = raw.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
      if (!text) return;
      addMessage(text, 'user');
      var match = matchIntent(text);
      respond(match.intent, match.state);
    }

    CHIPS.forEach(function (chip) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hci-chip';
      b.textContent = chip.label;
      b.addEventListener('click', function () {
        addMessage(chip.label, 'user');
        respond(chip.intent);
      });
      els.chips.appendChild(b);
    });

    function openPanel() {
      els.panel.classList.add('hci-open');
      els.launcher.setAttribute('aria-expanded', 'true');
      if (!opened) {
        opened = true;
        addMessage(OPENING, 'bot', [btn('Email me the free sample', SAMPLE_MAILTO)]);
      }
      els.input.focus();
    }

    function closePanel() {
      els.panel.classList.remove('hci-open');
      els.launcher.setAttribute('aria-expanded', 'false');
      els.launcher.focus();
    }

    els.launcher.addEventListener('click', function () {
      if (els.panel.classList.contains('hci-open')) {
        closePanel();
      } else {
        openPanel();
      }
    });
    els.closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && els.panel.classList.contains('hci-open')) {
        closePanel();
      }
    });
    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      handleUserText(els.input.value);
      els.input.value = '';
      els.input.focus();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
