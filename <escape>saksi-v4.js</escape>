
/* SAKSI-JKN V4
   Claim Relationship, Audit Budget, Case Workflow
   All cases and scores remain synthetic.
   Requires existing SAKSI-JKN v3 index.html.
*/

state.statuses ||= {};
state.statusHistory ||= [];

const V4_STATUSES = [
  "Pending Evidence",
  "Under Review",
  "Escalated",
  "Closed"
];

function v4Status(id) {
  return state.statuses[id] || "Pending Evidence";
}

function v4SetStatus(id, next, note = "") {
  if (!V4_STATUSES.includes(next)) return;

  const old = v4Status(id);
  if (old === next) return;

  state.statuses[id] = next;
  state.statusHistory.unshift({
    caseId: id,
    from: old,
    to: next,
    note: note.slice(0, 500),
    date: new Date().toLocaleString("id-ID")
  });

  save();
}

function v4SaveStatus(event) {
  event.preventDefault();

  const form = new FormData(event.currentTarget);
  const next = String(form.get("status"));
  const note = String(form.get("statusNote") || "");

  v4SetStatus(selected, next, note);
  render();
}

/* STATUS IN AUDIT QUEUE */

queueTable = function(items) {
  const htmlRows = items.map(({c, r}) => `
    <tr>
      <td>
        <button class="v4link"
          data-v4case="${escapeHTML(c.id)}">
          ${escapeHTML(c.id)}
        </button>
      </td>
      <td>${escapeHTML(c.participant)}</td>
      <td>${escapeHTML(c.dx)}</td>
      <td>${escapeHTML(c.service)}</td>
      <td>${pct(r.prior)}</td>
      <td class="num">${pct(r.posterior)}</td>
      <td>${escapeHTML(r.priority)}</td>
      <td><span class="v4tag">
        ${escapeHTML(v4Status(c.id))}
      </span></td>
    </tr>
  `).join("");

  return `
    <div style="overflow-x:auto">
      <table>
        <thead><tr>
          <th>Kasus</th><th>Peserta</th><th>ICD-10</th>
          <th>Layanan</th><th>Graph</th>
          <th>Bayesian</th><th>Prioritas</th>
          <th>Status</th>
        </tr></thead>
        <tbody>${htmlRows}</tbody>
      </table>
    </div>`;
};

/* INTERACTIVE RELATIONSHIP GRAPH */

function v4Relationship(c) {
  const related = state.cases.filter(
    x => x.participant === c.participant
  ).slice(0, 7);

  const positions = related.map((x, i) => ({
    ...x,
    x: related.length === 1
      ? 460
      : 90 + i * 740 / (related.length - 1)
  }));

  const lines = positions.map(x => `
    <line x1="460" y1="66"
      x2="${x.x}" y2="139"
      stroke="#9cabb2" stroke-width="2"/>
  `).join("");

  const matchingPairs = positions.flatMap((a, i) =>
    positions.slice(i + 1)
      .filter(b =>
        a.date === b.date &&
        a.dx === b.dx &&
        a.cbg === b.cbg
      )
      .map(b => `
        <path d="M${a.x} 215 L${b.x} 215"
          stroke="#ba8241" stroke-width="3"
          stroke-dasharray="6 5"/>
      `)
  ).join("");

  const nodes = positions.map(x => {
    const active = x.id === c.id;

    return `
      <g data-v4case="${escapeHTML(x.id)}"
        role="button" tabindex="0"
        aria-label="Buka ${escapeHTML(x.id)}"
        class="v4node">
        <rect x="${x.x - 55}" y="139"
          width="110" height="66" rx="9"
          fill="${active ? "#d7eeeb" : "#f0f4f6"}"
          stroke="${active ? "#087d77" : "#a5b5bc"}"
          stroke-width="${active ? 2.5 : 1.5}"/>
        <text x="${x.x}" y="159"
          text-anchor="middle" font-size="13"
          font-weight="700" fill="#173542">
          ${escapeHTML(x.id)}
        </text>
        <text x="${x.x}" y="176"
          text-anchor="middle" font-size="11"
          fill="#526b76">
          ${escapeHTML(x.dx)}
        </text>
        <text x="${x.x}" y="192"
          text-anchor="middle" font-size="10"
          fill="#526b76">
          ${escapeHTML(x.date)}
        </text>
      </g>`;
  }).join("");

  return `
    <div class="card">
      <div class="v4heading">
        <div>
          <h2>Claim Relationship Explorer</h2>
          <p class="muted">
            Klik node untuk membuka klaim terkait.
            Hubungan berasal dari skenario sintetis.
          </p>
        </div>
        <span class="v4tag">${related.length} klaim terkait</span>
      </div>

      <div class="v4graphscroll">
        <svg viewBox="0 0 920 245" width="100%"
          role="img"
          aria-label="Graf hubungan peserta dan klaim">
          ${lines}
          ${matchingPairs}

          <rect x="393" y="12"
            width="134" height="54" rx="9"
            fill="#dcece9" stroke="#087d77"
            stroke-width="2"/>

          <text x="460" y="35"
            text-anchor="middle"
            font-size="15" font-weight="700"
            fill="#173542">
            ${escapeHTML(c.participant)}
          </text>

          <text x="460" y="51"
            text-anchor="middle"
            font-size="11" fill="#526b76">
            Peserta simulasi
          </text>

          ${nodes}
        </svg>
      </div>

      <p class="muted">
        Garis abu-abu: hubungan peserta–klaim.
        Garis putus-putus: tanggal, diagnosis,
        dan INA-CBG identik.
      </p>
    </div>`;
}

/* EXPLAINABLE GRAPH SIGNALS */

function v4Explanation(c) {
  const r = analyze(c);
  const signals = [];

  if (r.sameDay > 0) {
    signals.push(
      `Ditemukan ${r.sameDay} klaim terkait
       dengan tanggal dan diagnosis sama.`
    );
  }

  if (r.sameCBG > 0) {
    signals.push(
      `${r.sameCBG} klaim terkait
       juga memiliki INA-CBG sama.`
    );
  }

  if (r.exactAmountMatches > 0) {
    signals.push(
      `${r.exactAmountMatches} klaim terkait
       memiliki nominal biaya identik.`
    );
  }

  if (r.guardrail && r.guardrail !== "None") {
    signals.push(
      `Guardrail diterapkan: ${r.guardrail}.`
    );
  }

  if (!signals.length) {
    signals.push(
      "Tidak ditemukan sinyal graf yang kuat
       pada kasus simulasi ini."
    );
  }

  return `
    <div class="card">
      <h2>Explainable Risk Findings</h2>

      ${signals.map(s => `
        <p class="v4finding">${escapeHTML(s)}</p>
      `).join("")}

      <div class="v4notice">
        Indeks Graph Expert: <b>${pct(r.prior)}</b>.
        Temuan administratif bukan bukti fraud.
        Skor berasal dari model sintetis
        yang belum terkalibrasi pada klaim nyata.
      </div>
    </div>`;
}

/* HUMAN AUDITOR CASE WORKFLOW */

function v4Workflow(c) {
  const current = v4Status(c.id);

  const history = state.statusHistory
    .filter(x => x.caseId === c.id);

  const options = V4_STATUSES.map(s => `
    <option value="${s}"
      ${s === current ? "selected" : ""}>
      ${s}
    </option>
  `).join("");

  return `
    <div class="card">
      <h2>Case Workflow & Status History</h2>

      <form onsubmit="v4SaveStatus(event)">
        <div class="v4twocol">
          <div>
            <label>Status penelaahan</label>
            <select name="status">${options}</select>
          </div>
          <div>
            <label>Alasan perubahan status</label>
            <input name="statusNote"
              maxlength="500"
              placeholder="Contoh: perlu klarifikasi dokumen">
          </div>
        </div>

        <button type="submit" class="primary">
          Perbarui Status
        </button>
      </form>

      <hr>

      <h2>Riwayat Status</h2>

      ${history.length ? history.map(h => `
        <div class="v4history">
          <strong>${escapeHTML(h.from)}
            → ${escapeHTML(h.to)}</strong>
          <p class="muted">${escapeHTML(h.date)}</p>
          <p>${escapeHTML(h.note || "Tanpa catatan")}</p>
        </div>
      `).join("") : `
        <p class="muted">
          Belum ada perubahan status.
        </p>
      `}
    </div>`;
}

/* AUGMENT CASE DETAILS */

const v4PreviousDetail = detail;

detail = function() {
  const original = v4PreviousDetail();
  const c = state.cases.find(
    x => x.id === selected
  );

  if (!c) return original;

  const insertAt = original.indexOf(
    '<div class="details">'
  );

  const newPanels =
    v4Relationship(c) +
    v4Explanation(c);

  if (insertAt < 0) {
    return original + newPanels + v4Workflow(c);
  }

  return (
    original.slice(0, insertAt) +
    newPanels +
    original.slice(insertAt) +
    v4Workflow(c)
  );
};

/* MAKE AUDITOR DECISIONS UPDATE WORKFLOW */

const v4PreviousDecision = saveDecision;

saveDecision = function(event) {
  const f = new FormData(event.currentTarget);
  const action = String(f.get("action") || "");
  const id = selected;

  v4PreviousDecision(event);

  const mapping = {
    "Verifikasi lanjutan": "Under Review",
    "Klarifikasi peserta": "Pending Evidence",
    "Verifikasi dokumen faskes": "Under Review",
    "Tidak ada indikasi lanjutan": "Closed"
  };

  if (mapping[action]) {
    v4SetStatus(
      id,
      mapping[action],
      "Keputusan auditor: " + action
    );
  }

  render();
};

/* AUDIT BUDGET SIMULATOR */

let v4BudgetPercentage = 10;

function v4BudgetResults() {
  const reports = state.cases.map(c => ({
    c,
    r: analyze(c)
  }));

  const count = reports.length;
  const slots = Math.min(
    count,
    Math.max(1, Math.ceil(
      count * v4BudgetPercentage / 100
    ))
  );

  const before = [...reports].sort(
    (a,b) => b.r.prior - a.r.prior
  ).slice(0, slots);

  const after = [...reports].sort(
    (a,b) => b.r.posterior - a.r.posterior
  ).slice(0, slots);

  const beforeIds = new Set(
    before.map(x => x.c.id)
  );

  const newlySelected = after.filter(
    x => !beforeIds.has(x.c.id)
  );

  const reviewedAmount = after.reduce(
    (sum,x) => sum + Number(x.c.amount),
    0
  );

  const makeTable = items => `
    <table>
      <thead>
        <tr>
          <th>Klaim</th>
          <th>Indeks</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(({c,r}) => `
          <tr>
            <td>
              <button class="v4link"
                data-v4case="${escapeHTML(c.id)}">
                ${escapeHTML(c.id)}
              </button>
            </td>
            <td>${pct(r.posterior)}</td>
            <td>${escapeHTML(v4Status(c.id))}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>`;

  return `
    <div class="grid">
      <div class="card">
        <div class="kpi-label">Kasus demo</div>
        <div class="kpi">${count}</div>
      </div>

      <div class="card">
        <div class="kpi-label">Slot audit</div>
        <div class="kpi">${slots}</div>
      </div>

      <div class="card">
        <div class="kpi-label">
          Pergeseran kasus setelah bukti
        </div>
        <div class="kpi">${newlySelected.length}</div>
      </div>

      <div class="card">
        <div class="kpi-label">
          Nominal klaim dalam antrean
        </div>
        <div class="v4amount">
          ${currency(reviewedAmount)}
        </div>
      </div>
    </div>

    <div class="split">
      <div class="card">
        <h2>Graph Expert Only</h2>
        <p class="muted">
          ${slots} klaim dipilih berdasarkan
          indeks sebelum evidensi.
        </p>
        ${makeTable(before)}
      </div>

      <div class="card">
        <h2>Graph + Evidence Expert</h2>
        <p class="muted">
          ${slots} klaim dipilih setelah
          pembaruan Bayesian.
        </p>
        ${makeTable(after)}
      </div>
    </div>

    <div class="v4notice">
      Jumlah slot dan nominal klaim merupakan
      hasil simulasi antrean, bukan estimasi
      uang yang dapat diselamatkan.
      Belum ada label fraud tervalidasi.
    </div>`;
}

function v4BudgetChange(value) {
  v4BudgetPercentage = Number(value);
  document.getElementById(
    "v4BudgetValue"
  ).textContent = value + "%";

  document.getElementById(
    "v4BudgetOutput"
  ).innerHTML = v4BudgetResults();
}

function v4BudgetView() {
  return `
    <div class="card">
      <h2>Audit Capacity Simulator</h2>
      <p>
        Tentukan kapasitas audit yang tersedia.
        SAKSI-JKN mengurutkan klaim sintetis
        berdasarkan prioritas pemeriksaan.
      </p>

      <label>
        Kapasitas pemeriksaan:
        <b id="v4BudgetValue">
          ${v4BudgetPercentage}%
        </b>
      </label>

      <input type="range"
        min="10" max="100" step="10"
        value="${v4BudgetPercentage}"
        oninput="v4BudgetChange(this.value)">

      <p class="muted">
        Gunakan Audit Queue untuk memperbarui
        Evidence Expert, lalu kembali ke halaman
        ini untuk melihat perubahan antrean.
      </p>
    </div>

    <div id="v4BudgetOutput">
      ${v4BudgetResults()}
    </div>`;
}

/* WORKFLOW SUMMARY ON OVERVIEW */

const v4PreviousHome = home;

home = function() {
  const counts = Object.fromEntries(
    V4_STATUSES.map(s => [s, 0])
  );

  state.cases.forEach(c => {
    counts[v4Status(c.id)]++;
  });

  const summary = `
    <div class="card">
      <h2>Auditor Case Workflow</h2>

      <div class="v4statusgrid">
        ${V4_STATUSES.map(s => `
          <div class="v4status">
            <span>${s}</span>
            <strong>${counts[s]}</strong>
          </div>
        `).join("")}
      </div>
    </div>`;

  return summary + v4PreviousHome();
};

/* NAVIGATION */

const v4NavigationAnchor =
  document.getElementById("nav-data");

if (
  v4NavigationAnchor &&
  !document.getElementById("nav-budget")
) {
  v4NavigationAnchor.insertAdjacentHTML(
    "beforebegin",
    `<button id="nav-budget"
       onclick="navigate('budget')">
       Audit Budget Simulator
     </button>`
  );
}

/* STYLE EXTENSION */

const v4Style = document.createElement("style");

v4Style.textContent = `
  .v4heading {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:12px;
    flex-wrap:wrap;
  }
  .v4graphscroll {
    width:100%;
    overflow-x:auto;
    margin:15px 0;
    background:#f9fbfb;
    border:1px solid #e0e8ea;
    border-radius:10px;
  }
  .v4graphscroll svg {
    min-width:640px;
    display:block;
  }
  .v4node {
    cursor:pointer;
  }
  .v4node:hover rect,
  .v4node:focus rect {
    stroke:#087d77;
    stroke-width:3;
  }
  .v4tag {
    display:inline-block;
    padding:6px 10px;
    border-radius:20px;
    border:1px solid #cbdcdd;
    background:#f1f6f6;
    font-size:11px;
    white-space:nowrap;
  }
  .v4finding {
    padding:12px 15px;
    background:#f6f9fa;
    border-left:3px solid #087d77;
    font-size:13px;
  }
  .v4notice {
    padding:15px;
    margin:15px 0;
    background:#fff9ed;
    border-left:3px solid #bd8c51;
    font-size:12px;
    line-height:1.7;
  }
  .v4twocol {
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:15px;
  }
  .v4history {
    padding:13px 0;
    border-bottom:1px solid #e4ecee;
  }
  .v4statusgrid {
    display:grid;
    grid-template-columns:repeat(4,1fr);
    gap:10px;
  }
  .v4status {
    background:#f6f8f9;
    border:1px solid #e1e9eb;
    border-radius:9px;
    padding:14px;
  }
  .v4status span {
    display:block;
    color:#657781;
    font-size:12px;
  }
  .v4status strong {
    display:block;
    font-size:23px;
    margin-top:8px;
  }
  .v4link {
    background:none;
    color:#087d77;
    padding:0;
    border:0;
    font-weight:700;
    text-decoration:underline;
  }
  .v4amount {
    font-size:19px;
    font-weight:800;
    margin-top:14px;
  }
  @media(max-width:800px) {
    .v4statusgrid {
      grid-template-columns:repeat(2,1fr);
    }
    .v4twocol {
      grid-template-columns:1fr;
    }
  }
`;

document.head.appendChild(v4Style);

/* CLICKABLE GRAPH AND CASE LINKS */

document.addEventListener("click", event => {
  const target = event.target.closest(
    "[data-v4case]"
  );

  if (!target) return;

  const id = target.getAttribute("data-v4case");
  if (state.cases.some(c => c.id === id)) {
    review(id);
  }
});

document.addEventListener("keydown", event => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const target = event.target.closest(
    "g[data-v4case]"
  );

  if (!target) return;

  event.preventDefault();
  const id = target.getAttribute("data-v4case");

  if (state.cases.some(c => c.id === id)) {
    review(id);
  }
});

/* PRESERVE V3 AND VALIDATION ROUTES */

const v4PreviousRender = render;

render = function() {
  if (view !== "budget") {
    v4PreviousRender();
    return;
  }

  document.getElementById(
    "heading"
  ).textContent = "Audit Budget Simulator";

  document.getElementById(
    "subheading"
  ).textContent =
    "Audit prioritization under limited review capacity";

  document.querySelectorAll("nav button")
    .forEach(b => b.classList.remove("active"));

  document.getElementById(
    "nav-budget"
  ).classList.add("active");

  document.getElementById(
    "content"
  ).innerHTML = v4BudgetView();
};

render();

/* END SAKSI-JKN V4 */
