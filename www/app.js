// PCS Compliance Assessment - wizard logic
(function () {
  "use strict";

  var state = {
    contact: { name: "", email: "", phone: "", company: "", industry: "" },
    infra: {}, // infra[fieldId] = string (dropdown) | array of strings (multi)
    infraNotes: "",
    region: null, // 'india' | 'global'
    selectedCompliances: [], // array of ids, in catalog order
    answers: {}, // answers[complianceId][questionId] = value
    schedule: { date: "", time: "", notes: "" }
  };

  var currentStep = 1;
  var TOTAL_STEPS = 5;

  // Google Apps Script connector (stores submissions in Google Drive and
  // emails sandeep@pcssolutions.co.in). Used directly on iOS/web; on Android
  // the native bridge posts to the same URL instead.
  var UPLOAD_URL = "https://script.google.com/macros/s/AKfycbyX2DfDJT3lUbAmqn6Xwmr_AXpPGfw_n2aD32-J-14apn-b1_riHtPU2OviRfWJz_Yy/exec";
  var PENDING_KEY = "pcs_pending_uploads";

  var mainEl = document.getElementById("main");
  var footerNav = document.getElementById("footerNav");
  var btnBack = document.getElementById("btnBack");
  var btnNext = document.getElementById("btnNext");

  function $(id) { return document.getElementById(id); }

  function showStep(n) {
    currentStep = n;
    for (var i = 0; i <= 6; i++) {
      var el = $("step" + i);
      if (el) el.classList.toggle("active", i === n);
    }
    document.body.classList.toggle("welcome-mode", n === 0);
    updateProgress(n);
    if (n === 0 || n === 6) {
      footerNav.style.display = "none";
    } else {
      footerNav.style.display = "block";
      btnBack.style.visibility = "visible";
      btnNext.textContent = (n === TOTAL_STEPS) ? "Submit" : "Next";
      btnNext.classList.toggle("gold", n === TOTAL_STEPS);
    }
    mainEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function updateProgress(n) {
    var bars = document.querySelectorAll("#progressBar .s");
    bars.forEach(function (bar) {
      var step = parseInt(bar.getAttribute("data-step"), 10);
      bar.classList.remove("done", "current");
      if (step < n) bar.classList.add("done");
      else if (step === n) bar.classList.add("current");
    });
  }

  function setInvalid(fieldId, invalid) {
    var el = $(fieldId);
    if (!el) return;
    el.classList.toggle("invalid", invalid);
  }

  // ---------- STEP 1 validation ----------
  function validateStep1() {
    var ok = true;
    var name = $("in-name").value.trim();
    var email = $("in-email").value.trim();
    var phone = $("in-phone").value.trim();
    var company = $("in-company").value.trim();
    var industry = $("in-industry").value;

    var nameOk = name.length >= 2;
    setInvalid("f-name", !nameOk); if (!nameOk) ok = false;

    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setInvalid("f-email", !emailOk); if (!emailOk) ok = false;

    var phoneDigits = phone.replace(/[^0-9]/g, "");
    var phoneOk = phoneDigits.length >= 7 && phoneDigits.length <= 15;
    setInvalid("f-phone", !phoneOk); if (!phoneOk) ok = false;

    var companyOk = company.length >= 2;
    setInvalid("f-company", !companyOk); if (!companyOk) ok = false;

    var industryOk = industry !== "";
    setInvalid("f-industry", !industryOk); if (!industryOk) ok = false;

    if (ok) {
      state.contact = { name: name, email: email, phone: phone, company: company, industry: industry };
    }
    return ok;
  }

  // ---------- STEP 2: infrastructure & security landscape ----------
  function renderInfra() {
    var container = $("infra-container");
    container.innerHTML = "";

    INFRA_SECTIONS.forEach(function (section) {
      var h = document.createElement("div");
      h.className = "group-title";
      h.textContent = section.title;
      container.appendChild(h);

      section.fields.forEach(function (field) {
        var label = document.createElement("label");
        label.className = "field-label";
        label.textContent = field.label;
        container.appendChild(label);

        if (field.type === "dropdown") {
          var select = document.createElement("select");
          select.id = "infra_" + field.id;
          var placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = "Select...";
          select.appendChild(placeholder);
          field.options.forEach(function (opt) {
            var o = document.createElement("option");
            o.value = opt;
            o.textContent = opt;
            select.appendChild(o);
          });
          select.addEventListener("change", function () {
            state.infra[field.id] = select.value;
          });
          container.appendChild(select);
        } else if (field.type === "multi") {
          var grid = document.createElement("div");
          grid.className = "chip-grid";
          field.options.forEach(function (opt) {
            var chip = document.createElement("label");
            chip.className = "chip";
            var cb = document.createElement("input");
            cb.type = "checkbox";
            cb.value = opt;
            cb.addEventListener("change", function () {
              var arr = state.infra[field.id] || [];
              var idx = arr.indexOf(opt);
              if (cb.checked && idx === -1) arr.push(opt);
              else if (!cb.checked && idx !== -1) arr.splice(idx, 1);
              state.infra[field.id] = arr;
            });
            var span = document.createElement("span");
            span.textContent = opt;
            chip.appendChild(cb);
            chip.appendChild(span);
            grid.appendChild(chip);
          });
          container.appendChild(grid);
        }
      });
    });
  }

  // ---------- STEP 3: region + compliance selection ----------
  function renderComplianceList() {
    var container = $("compliance-list");
    container.innerHTML = "";
    if (!state.region) return;

    var catalog = state.region === "india" ? INDIA_COMPLIANCES : GLOBAL_COMPLIANCES;
    catalog.forEach(function (grp) {
      var h = document.createElement("div");
      h.className = "group-title";
      h.textContent = grp.group;
      container.appendChild(h);

      grp.items.forEach(function (item) {
        var row = document.createElement("label");
        row.className = "comp-card";
        row.setAttribute("for", "compliance_" + item.id);

        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = "compliance_" + item.id;
        cb.value = item.id;
        cb.checked = state.selectedCompliances.indexOf(item.id) !== -1;
        cb.addEventListener("change", onComplianceToggle);

        var name = document.createElement("span");
        name.className = "comp-name";
        name.textContent = item.name;

        row.appendChild(cb);
        row.appendChild(name);
        container.appendChild(row);
      });
    });
    updateSelectionCount();
  }

  function onComplianceToggle(e) {
    var id = e.target.value;
    var idx = state.selectedCompliances.indexOf(id);
    if (e.target.checked && idx === -1) {
      state.selectedCompliances.push(id);
    } else if (!e.target.checked && idx !== -1) {
      state.selectedCompliances.splice(idx, 1);
    }
    updateSelectionCount();
    $("compliance-err").style.display = "none";
  }

  function updateSelectionCount() {
    var n = state.selectedCompliances.length;
    var el = $("selection-count");
    el.style.display = state.region ? "inline-block" : "none";
    el.textContent = n === 0
      ? "No compliances selected yet"
      : n + " compliance" + (n === 1 ? "" : "s") + " selected";
  }

  function selectRegion(region) {
    if (state.region === region) return;
    state.region = region;
    state.selectedCompliances = []; // switching region invalidates previous selection
    $("region-india").classList.toggle("selected", region === "india");
    $("region-global").classList.toggle("selected", region === "global");
    $("region-err").style.display = "none";
    renderComplianceList();
  }

  function validateStep2() {
    var ok = true;
    if (!state.region) {
      $("region-err").style.display = "block";
      ok = false;
    }
    if (state.selectedCompliances.length === 0) {
      $("compliance-err").style.display = "block";
      ok = false;
    }
    return ok;
  }

  // ---------- STEP 3: dynamic questionnaire ----------
  function renderQuestionnaire() {
    var container = $("questionnaire-container");
    container.innerHTML = "";

    state.selectedCompliances.forEach(function (compId) {
      var questions = QUESTION_BANK[compId];
      if (!questions) return;

      var section = document.createElement("div");
      section.className = "compliance-section";

      var head = document.createElement("div");
      head.className = "comp-head";
      var h3 = document.createElement("h3");
      h3.innerHTML = COMPLIANCE_NAME_LOOKUP[compId] || compId;
      head.appendChild(h3);
      section.appendChild(head);

      questions.forEach(function (q) {
        var block = document.createElement("div");
        block.className = "q-block";
        var fieldId = "q_" + compId + "_" + q.id;

        if (q.type === "checkbox") {
          var wrap = document.createElement("label");
          wrap.className = "q-checkbox";
          var input = document.createElement("input");
          input.type = "checkbox";
          input.id = fieldId;
          var saved = getAnswer(compId, q.id);
          input.checked = saved === true;
          input.addEventListener("change", function () {
            setAnswer(compId, q.id, input.checked);
          });
          var span = document.createElement("span");
          span.textContent = q.text;
          wrap.appendChild(input);
          wrap.appendChild(span);
          block.appendChild(wrap);
        } else if (q.type === "dropdown") {
          var label = document.createElement("div");
          label.className = "q-text";
          label.textContent = q.text;
          var select = document.createElement("select");
          select.id = fieldId;
          var placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = "Select...";
          select.appendChild(placeholder);
          q.options.forEach(function (opt) {
            var o = document.createElement("option");
            o.value = opt;
            o.textContent = opt;
            select.appendChild(o);
          });
          var savedVal = getAnswer(compId, q.id);
          select.value = savedVal || "";
          select.addEventListener("change", function () {
            setAnswer(compId, q.id, select.value);
          });
          block.appendChild(label);
          block.appendChild(select);
        }

        section.appendChild(block);
      });

      container.appendChild(section);
    });
  }

  function getAnswer(compId, qId) {
    return state.answers[compId] && state.answers[compId][qId];
  }
  function setAnswer(compId, qId, value) {
    if (!state.answers[compId]) state.answers[compId] = {};
    state.answers[compId][qId] = value;
  }

  // ---------- STEP 4: schedule ----------
  function validateStep4() {
    var ok = true;
    var date = $("in-date").value;
    var time = $("in-time").value;

    setInvalid("f-date", !date); if (!date) ok = false;
    setInvalid("f-time", !time); if (!time) ok = false;

    if (ok) {
      state.schedule = { date: date, time: time, notes: $("in-notes").value.trim() };
    }
    return ok;
  }

  // ---------- Report assembly ----------
  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function buildReportHtml() {
    var now = new Date();
    var submittedAt = now.toLocaleString();

    var infraHtml = INFRA_SECTIONS.map(function (section) {
      var rows = section.fields.map(function (field) {
        var val = state.infra[field.id];
        var display;
        if (Array.isArray(val) && val.length > 0) display = escapeHtml(val.join("; "));
        else if (typeof val === "string" && val) display = escapeHtml(val);
        else display = "Not specified";
        return "<tr><td class='k'>" + escapeHtml(field.label) + "</td><td>" + display + "</td></tr>";
      }).join("");
      return "<h3>" + escapeHtml(section.title) + "</h3><table class='info-table'>" + rows + "</table>";
    }).join("");
    if (state.infraNotes) {
      infraHtml += "<h3>Additional Environment Notes</h3><p style='font-size:13.5px;line-height:1.6;margin:4px 0 0;'>" +
        escapeHtml(state.infraNotes) + "</p>";
    }

    var complianceListHtml = state.selectedCompliances.map(function (id) {
      return "<li>" + (COMPLIANCE_NAME_LOOKUP[id] || id) + "</li>";
    }).join("");

    var questionnaireHtml = state.selectedCompliances.map(function (compId) {
      var questions = QUESTION_BANK[compId] || [];
      var rows = questions.map(function (q) {
        var ans = getAnswer(compId, q.id);
        var display;
        if (q.type === "checkbox") {
          display = ans === true ? "Yes" : "No / Not confirmed";
        } else {
          display = ans ? escapeHtml(ans) : "Not answered";
        }
        return "<tr><td class='qcell'>" + escapeHtml(q.text) + "</td><td class='acell'>" + display + "</td></tr>";
      }).join("");

      return "<h3>" + (COMPLIANCE_NAME_LOOKUP[compId] || compId) + "</h3>" +
        "<table class='qa-table'><thead><tr><th>Question</th><th>Response</th></tr></thead><tbody>" +
        rows + "</tbody></table>";
    }).join("");

    var c = state.contact;
    var s = state.schedule;

    return "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
      "<title>PCS Compliance Assessment Submission - " + escapeHtml(c.company) + "</title>" +
      "<style>" +
      "body{font-family:Arial,Helvetica,sans-serif;color:#16232F;margin:0;padding:24px;background:#F4F7FA;}" +
      ".wrap{max-width:720px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #E3E9EF;}" +
      ".head{background:#0A2540;padding:26px 30px 22px;}" +
      ".head h1{font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#fff;margin:0 0 6px;}" +
      ".head .sub{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#D4AF37;margin:0 0 10px;font-weight:bold;}" +
      ".head .stamp{font-size:12px;color:rgba(255,255,255,0.6);margin:0;}" +
      ".body{padding:26px 30px 30px;}" +
      "h2{font-size:14px;color:#0A2540;letter-spacing:0.5px;text-transform:uppercase;border-bottom:2px solid #B08D3E;padding-bottom:7px;margin:28px 0 12px;}" +
      "h2:first-child{margin-top:0;}" +
      "h3{font-size:14px;color:#0A2540;margin:22px 0 8px;}" +
      "table.info-table{width:100%;border-collapse:collapse;margin-bottom:8px;}" +
      "table.info-table td{padding:7px 8px;font-size:13.5px;border-bottom:1px solid #EEF2F6;}" +
      "table.info-table td.k{font-weight:bold;width:180px;color:#66788A;}" +
      "table.qa-table{width:100%;border-collapse:collapse;margin-bottom:6px;}" +
      "table.qa-table th{text-align:left;font-size:12px;background:#0A2540;color:#fff;padding:9px 8px;}" +
      "table.qa-table td{padding:9px 8px;font-size:13px;border-bottom:1px solid #EEF2F6;vertical-align:top;}" +
      "td.qcell{width:65%;}" +
      "ul.comp-list{margin:0 0 4px;padding-left:20px;font-size:13.5px;line-height:1.7;}" +
      ".muted{color:#66788A;font-size:12px;margin-top:26px;}" +
      "</style></head><body><div class='wrap'>" +
      "<div class='head'>" +
      "<p class='sub'>PCS Solutions &middot; Cyber Security &amp; Compliance Advisory</p>" +
      "<h1>Compliance Assessment Submission</h1>" +
      "<p class='stamp'>Submitted: " + escapeHtml(submittedAt) + "</p>" +
      "</div><div class='body'>" +

      "<h2>Contact &amp; Company Details</h2>" +
      "<table class='info-table'>" +
      "<tr><td class='k'>Full Name</td><td>" + escapeHtml(c.name) + "</td></tr>" +
      "<tr><td class='k'>Email</td><td>" + escapeHtml(c.email) + "</td></tr>" +
      "<tr><td class='k'>Phone</td><td>" + escapeHtml(c.phone) + "</td></tr>" +
      "<tr><td class='k'>Company</td><td>" + escapeHtml(c.company) + "</td></tr>" +
      "<tr><td class='k'>Industry</td><td>" + escapeHtml(c.industry) + "</td></tr>" +
      "<tr><td class='k'>Region</td><td>" + (state.region === "india" ? "India" : "Outside India (Global)") + "</td></tr>" +
      "</table>" +

      "<h2>Infrastructure &amp; Security Landscape</h2>" +
      infraHtml +

      "<h2>Selected Compliances</h2>" +
      "<ul class='comp-list'>" + complianceListHtml + "</ul>" +

      "<h2>Questionnaire Responses</h2>" +
      questionnaireHtml +

      "<h2>Preferred Presentation Slot</h2>" +
      "<table class='info-table'>" +
      "<tr><td class='k'>Date</td><td>" + escapeHtml(s.date) + "</td></tr>" +
      "<tr><td class='k'>Time</td><td>" + escapeHtml(s.time) + "</td></tr>" +
      "<tr><td class='k'>Additional Notes</td><td>" + (s.notes ? escapeHtml(s.notes) : "&mdash;") + "</td></tr>" +
      "</table>" +

      "<p class='muted'>Generated by the PCS Compliance Assessment app.</p>" +
      "</div></div></body></html>";
  }

  function submitReport() {
    var htmlContent = buildReportHtml();
    var subject = "PCS Compliance Assessment - " + state.contact.company + " (" + state.contact.name + ")";

    if (window.AndroidBridge && typeof window.AndroidBridge.sendReport === "function") {
      // Android: native upload with its own offline retry queue.
      window.AndroidBridge.sendReport(state.contact.name, state.contact.company, subject, htmlContent);
    } else {
      // iOS / web: upload directly. text/plain avoids a CORS preflight,
      // which Google Apps Script does not answer; the body is still JSON.
      uploadFromJs(JSON.stringify({
        name: state.contact.name,
        company: state.contact.company,
        subject: subject,
        html: htmlContent
      }));
    }
    showStep(6);
  }

  function uploadFromJs(payload) {
    if (!window.fetch) { queuePending(payload); return; }
    fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: payload
    }).then(function (res) {
      if (!res.ok) queuePending(payload);
    }).catch(function () {
      queuePending(payload);
    });
  }

  function queuePending(payload) {
    try {
      var arr = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
      arr.push(payload);
      localStorage.setItem(PENDING_KEY, JSON.stringify(arr));
    } catch (e) { /* storage unavailable - nothing more we can do silently */ }
  }

  // Submissions that failed to send (e.g. offline) are retried on next launch.
  function retryPendingFromJs() {
    var arr;
    try { arr = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]"); } catch (e) { return; }
    if (!arr.length || !window.fetch) return;
    localStorage.setItem(PENDING_KEY, "[]");
    arr.forEach(function (payload) { uploadFromJs(payload); });
  }

  // ---------- Navigation ----------
  function goNext() {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      showStep(2);
    } else if (currentStep === 2) {
      state.infraNotes = $("in-infra-notes").value.trim();
      showStep(3);
    } else if (currentStep === 3) {
      if (!validateStep2()) return;
      renderQuestionnaire();
      showStep(4);
    } else if (currentStep === 4) {
      showStep(5);
    } else if (currentStep === 5) {
      if (!validateStep4()) return;
      submitReport();
    }
  }

  function goBack() {
    if (currentStep > 0) showStep(currentStep - 1);
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", function () {
    $("region-india").addEventListener("click", function () { selectRegion("india"); });
    $("region-global").addEventListener("click", function () { selectRegion("global"); });
    btnNext.addEventListener("click", goNext);
    btnBack.addEventListener("click", goBack);
    $("btnBegin").addEventListener("click", function () { showStep(1); });
    renderInfra();
    showStep(0);
    if (!window.AndroidBridge) retryPendingFromJs();
  });
})();
