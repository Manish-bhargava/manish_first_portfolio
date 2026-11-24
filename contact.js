/* "Let's connect" popup: send a message or request a call. Posts to /api/contact (emails Manish).
   Any element with [data-contact] opens it; data-contact="call" opens on the call tab. */
(function () {
  "use strict";
  var EMAIL = "bhargavmanish908@gmail.com";
  var SLOTS = []; for (var m = 600; m <= 1110; m += 30) SLOTS.push(m); // 10:00 – 18:30 IST

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); }
  function label12(min) { var h = Math.floor(min / 60), mm = pad(min % 60); return ((h + 11) % 12 + 1) + ":" + mm + (h < 12 ? " am" : " pm"); }
  function istNow() { var d = new Date(); return new Date(d.getTime() + (d.getTimezoneOffset() + 330) * 60000); } // wall-clock IST as local Date
  function istToUtc(dateStr, min) { var p = dateStr.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], Math.floor(min / 60), min % 60) - 330 * 60000); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function days() {
    var out = [], now = istNow(), d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (out.length < 10) {
      var wd = d.getDay();
      if (wd !== 0 && wd !== 6) {
        var iso = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
        var nowMin = now.getHours() * 60 + now.getMinutes();
        var isToday = d.toDateString() === new Date(now.getFullYear(), now.getMonth(), now.getDate()).toDateString();
        if (!isToday || SLOTS.some(function (s) { return s > nowMin + 60; }))
          out.push({ iso: iso, today: isToday, wd: d.toLocaleDateString("en-IN", { weekday: "short" }), day: d.getDate(), mon: d.toLocaleDateString("en-IN", { month: "short" }) });
      }
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  var dlg = document.createElement("dialog");
  dlg.className = "cx"; dlg.setAttribute("aria-labelledby", "cxTitle");
  dlg.innerHTML =
    '<div class="cx-inner">' +
    '<button class="cx-close" type="button" aria-label="Close">✕</button>' +
    '<span class="cx-eyebrow">LET’S CONNECT</span>' +
    '<h2 id="cxTitle">Say hello to <em>Manish.</em></h2>' +
    '<p class="cx-sub">Send a message or request a call — it lands straight in his inbox.</p>' +
    '<div class="cx-tabs" role="tablist"><button type="button" role="tab" data-tab="message" aria-selected="true">✉ Send a message</button><button type="button" role="tab" data-tab="call" aria-selected="false">☎ Book a call</button></div>' +
    '<form class="cx-form" novalidate>' +
      '<div class="cx-grid">' +
        '<label>Your name<input name="name" required maxlength="80" autocomplete="name" placeholder="Priya Sharma" /></label>' +
        '<label>Work email<input name="email" type="email" required maxlength="120" autocomplete="email" placeholder="priya@company.com" /></label>' +
        '<label>Company<input name="company" maxlength="100" autocomplete="organization" placeholder="Acme" /></label>' +
        '<label>Hiring for<input name="role" maxlength="100" placeholder="Backend Engineer" list="cxRoles" /></label>' +
      '</div>' +
      '<datalist id="cxRoles"><option value="SDE Intern"><option value="Full Stack Engineer"><option value="Backend Engineer"><option value="Frontend Engineer"><option value="AI / GenAI Engineer"></datalist>' +
      '<div class="cx-call" hidden>' +
        '<span class="cx-label">Pick a day</span><div class="cx-days" role="radiogroup" aria-label="Day"></div>' +
        '<span class="cx-label">Pick a time <small>(India time, IST)</small></span><div class="cx-slots" role="radiogroup" aria-label="Time"></div>' +
        '<p class="cx-local" aria-live="polite"></p>' +
        '<div class="cx-grid">' +
          '<label>Call length<select name="duration"><option value="15">15 minutes</option><option value="30" selected>30 minutes</option><option value="45">45 minutes</option></select></label>' +
          '<label>How<select name="mode"><option value="meet">Google Meet</option><option value="phone">Phone call</option></select></label>' +
          '<label class="cx-phone" hidden>Your phone<input name="phone" type="tel" maxlength="20" autocomplete="tel" placeholder="+91 98765 43210" /></label>' +
        '</div>' +
      '</div>' +
      '<label class="cx-msg"><span class="cx-msg-label">Message</span><textarea name="message" rows="5" maxlength="2000" placeholder="Hi Manish, we’re hiring for…"></textarea></label>' +
      '<label class="cx-hp" aria-hidden="true">Website<input name="website" tabindex="-1" autocomplete="off" /></label>' +
      '<p class="cx-error" role="alert"></p>' +
      '<button class="cx-send" type="submit"><span>Send message</span> →</button>' +
      '<p class="cx-note">Prefer email? <a href="mailto:' + EMAIL + '">' + EMAIL + '</a></p>' +
    '</form>' +
    '<div class="cx-done" hidden></div>' +
    '</div>';
  document.body.appendChild(dlg);

  var form = dlg.querySelector("form"), tabs = dlg.querySelectorAll(".cx-tabs button"), callBox = dlg.querySelector(".cx-call"),
      daysBox = dlg.querySelector(".cx-days"), slotsBox = dlg.querySelector(".cx-slots"), local = dlg.querySelector(".cx-local"),
      err = dlg.querySelector(".cx-error"), send = dlg.querySelector(".cx-send"), done = dlg.querySelector(".cx-done"),
      phoneBox = dlg.querySelector(".cx-phone"), msgLabel = dlg.querySelector(".cx-msg-label");
  var state = { type: "message", date: "", time: null, busy: false };

  function renderDays() {
    var list = days();
    if (!list.some(function (d) { return d.iso === state.date; })) state.date = list[0].iso;
    daysBox.innerHTML = list.map(function (d) {
      return '<button type="button" role="radio" aria-checked="' + (d.iso === state.date) + '" data-date="' + d.iso + '"><small>' + (d.today ? "Today" : d.wd) + "</small><b>" + d.day + "</b><small>" + d.mon + "</small></button>";
    }).join("");
    renderSlots();
  }
  function renderSlots() {
    var now = istNow(), todayIso = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()), nowMin = now.getHours() * 60 + now.getMinutes();
    var open = SLOTS.filter(function (s) { return state.date !== todayIso || s > nowMin + 60; });
    if (open.indexOf(state.time) < 0) state.time = null;
    slotsBox.innerHTML = open.map(function (s) { return '<button type="button" role="radio" aria-checked="' + (s === state.time) + '" data-min="' + s + '">' + label12(s) + "</button>"; }).join("");
    showLocal();
  }
  function showLocal() {
    if (state.time == null) { local.textContent = ""; return; }
    var dt = istToUtc(state.date, state.time), tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    local.textContent = tz === "Asia/Calcutta" || tz === "Asia/Kolkata" ? "" :
      "That’s " + dt.toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" }) + " your time (" + tz + ").";
  }
  function setTab(t) {
    state.type = t;
    tabs.forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tab === t)); });
    callBox.hidden = t !== "call";
    msgLabel.textContent = t === "call" ? "Anything to add? (optional)" : "Message";
    send.querySelector("span").textContent = t === "call" ? "Request this call" : "Send message";
    if (t === "call") renderDays();
    err.textContent = "";
  }
  tabs.forEach(function (b) { b.addEventListener("click", function () { setTab(b.dataset.tab); }); });
  daysBox.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; state.date = b.dataset.date; renderDays(); });
  slotsBox.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; state.time = +b.dataset.min; renderSlots(); });
  form.mode.addEventListener("change", function () { phoneBox.hidden = form.mode.value !== "phone"; });

  function gmailFallback(d) {
    var body = "Name: " + d.name + "\nCompany: " + (d.company || "-") + "\nHiring for: " + (d.role || "-") + "\n" +
      (d.type === "call" ? "Requested call: " + d.date + " " + d.time + " IST, " + d.duration + " min, " + (d.mode === "phone" ? "phone " + d.phone : "Google Meet") + "\n" : "") + "\n" + (d.message || "");
    var url = "https://mail.google.com/mail/?view=cm&fs=1&to=" + EMAIL + "&su=" + encodeURIComponent(d.type === "call" ? "Call request from " + d.name : "Hello from " + d.name) + "&body=" + encodeURIComponent(body);
    window.open(url, "_blank", "noopener");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (state.busy) return;
    var d = { type: state.type, name: form.name.value.trim(), email: form.email.value.trim(), company: form.company.value.trim(), role: form.role.value.trim(), message: form.message.value.trim(), website: form.website.value };
    if (d.name.length < 2) return fail("Please add your name.", form.name);
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(d.email)) return fail("Please add a valid email address.", form.email);
    if (d.type === "message" && d.message.length < 10) return fail("Add a few words to your message.", form.message);
    if (d.type === "call") {
      if (state.time == null) return fail("Pick a time slot.", slotsBox.querySelector("button"));
      d.date = state.date; d.time = hhmm(state.time); d.duration = +form.duration.value; d.mode = form.mode.value; d.phone = form.phone.value.trim();
      if (d.mode === "phone" && !/^\+?[\d\s()-]{7,20}$/.test(d.phone)) return fail("Add a phone number to call.", form.phone);
    }
    state.busy = true; send.disabled = true; send.querySelector("span").textContent = "Sending…"; err.textContent = "";
    var req = location.protocol === "file:" ? Promise.reject({ fallback: true }) :
      fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then(function (r) {
        var json = (r.headers.get("content-type") || "").indexOf("json") > -1 ? r.json() : Promise.resolve({});
        return json.then(function (j) {
          if (r.ok) return j;
          if (r.status === 404 || r.status === 503 || j.error === "not_configured" || j.error === "send_failed") throw { fallback: true };
          throw { message: j.error || "Something went wrong — please try again." };
        });
      });
    req.then(function () { success(d, false); }, function (x) {
      if (x && x.fallback) { gmailFallback(d); success(d, true); }
      else fail(x && x.message ? x.message : "Couldn’t send — check your connection and try again.");
    }).then(function () { state.busy = false; send.disabled = false; setTab(state.type); });
  });

  function fail(msg, el) { err.textContent = msg; if (el && el.focus) el.focus(); }
  function success(d, viaGmail) {
    var cal = "";
    if (d.type === "call") {
      var start = istToUtc(d.date, state.time), end = new Date(start.getTime() + d.duration * 60000);
      var stamp = function (x) { return x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
      var link = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent("Call with Manish Bhargava") + "&dates=" + stamp(start) + "/" + stamp(end) +
        "&details=" + encodeURIComponent("Requested via manish's portfolio. He'll confirm by email.") + "&add=" + EMAIL;
      cal = '<p class="cx-when">' + esc(start.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })) + " · " + d.duration + " min</p>" +
        '<a class="cx-cal" href="' + link + '" target="_blank" rel="noopener">Add to my Google Calendar ↗</a>';
    }
    done.innerHTML = '<div class="cx-check">✓</div><h3>' + (d.type === "call" ? "Call requested!" : "Message sent!") + "</h3>" +
      "<p>" + (viaGmail ? "We opened Gmail with your message ready — just hit <b>Send</b> there." : "Thanks, " + esc(d.name.split(" ")[0]) + " — Manish will reply to <b>" + esc(d.email) + "</b> soon" + (d.type === "call" ? " to confirm the time." : ".")) + "</p>" + cal +
      '<button type="button" class="cx-again">Send another</button>';
    form.hidden = true; done.hidden = false;
    done.querySelector(".cx-again").addEventListener("click", function () { form.reset(); state.time = null; phoneBox.hidden = true; done.hidden = true; form.hidden = false; setTab("message"); });
  }

  function open(tab) {
    if (!done.hidden) { done.hidden = true; form.hidden = false; }
    setTab(tab === "call" ? "call" : "message");
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    document.body.classList.add("modal-open");
    setTimeout(function () { form.name.focus(); }, 60);
  }
  function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  dlg.addEventListener("close", function () { document.body.classList.remove("modal-open"); });
  dlg.querySelector(".cx-close").addEventListener("click", close);
  dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-contact]");
    if (!t) return;
    e.preventDefault(); open(t.getAttribute("data-contact"));
  });
  window.openContact = open;
})();
