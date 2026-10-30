/* SAKSI-JKN v4 — interactive synthetic auditor workflow.
 * Requires index.html from SAKSI-JKN v1-v3.
 * No identifiable BPJS data are loaded or transmitted.
 */
(function () {
  'use strict';
  if (window.__SAKSI_V4_READY__) return;

  function bootstrap() {
    if (typeof state === 'undefined' || typeof analyze !== 'function' ||
        typeof render !== 'function' || typeof detail !== 'function' ||
        typeof home !== 'function' || typeof queueTable !== 'function') {
      console.error('SAKSI-JKN v4: base app not loaded. Load saksi-v4.js after inline application script.');
      return;
    }
    const nav = document.querySelector('nav');
    if (!nav) {
      console.error('SAKSI-JKN v4: navigation not found.');
      return;
    }
    window.__SAKSI_V4_READY__ = true;
    document.documentElement.setAttribute('data-saksi-version', 'v4');
    state.statuses = state.statuses || {};
    state.statusHistory = state.statusHistory || [];

    const STATUS = ['Pending Evidence', 'Under Review', 'Escalated', 'Closed'];
    const currentStatus = id => state.statuses[id] || 'Pending Evidence';
    const esc = value => escapeHTML(value);

    const style = document.createElement('style');
    style.textContent = `
    .v4-title{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
    .v4-tag{display:inline-block;background:#eaf4f2;border:1px solid #c6dcd8;color:#17645e;border-radius:40px;padding:6px 11px;font-size:12px;font-weight:700}
    .v4-chart{overflow-x:auto;border:1px solid #e0e7e9;background:#f9fbfc;border-radius:12px;padding:12px;margin:18px 0}
    .v4-chart svg{min-width:560px;display:block}
    .v4-node{cursor:pointer;outline:none}.v4-node:hover rect,.v4-node:focus rect{stroke:#006d67;stroke-width:3}
    .v4-finding{border-left:3px solid #087d77;padding:11px 15px;background:#f7fafb;margin:9px 0;font-size:13px;line-height:1.5}
    .v4-warning{padding:13px 16px;background:#fff9ed;border-left:3px solid #ac814d;font-size:12px;line-height:1.7;margin:15px 0}
    .v4-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
    .v4-metric{background:#f8fafb;border:1px solid #e2e9ea;border-radius:10px;padding:16px}
    .v4-metric span{display:block;color:#657782;font-size:12px}.v4-metric b{display:block;font-size:23px;margin-top:9px}
    .v4-split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .v4-link{color:#087d77;border:0;background:transparent;cursor:pointer;font:inherit;font-weight:700;text-decoration:underline;padding:0}
    .v4-history{border-bottom:1px solid #e2e9eb;padding:12px 0}
    @media(max-width:950px){.v4-grid{grid-template-columns:repeat(2,1fr)}.v4-split{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    function changeStatus(id, next, note) {
      if (!STATUS.includes(next)) return;
      const prev = currentStatus(id);
      if (next === prev) return;
      state.statuses[id] = next;
      state.statusHistory.unshift({caseId:id, from:prev, to:next,
        date:new Date().toLocaleString('id-ID'), note:String(note||'').slice(0,500)});
      save();
    }

    function relationship(c) {
      const group = state.cases.filter(x => x.participant === c.participant).slice(0,7);
      const xs = group.map((_,i) => group.length===1 ? 460 : 90 + i * 740/(group.length-1));
      const edges = xs.map(x => `<line x1="460" y1="67" x2="${x}" y2="143" stroke="#a0b1b9" stroke-width="2"/>`).join('');
      let matching = '';
      group.forEach((a,i) => group.slice(i+1).forEach((b,k) => {
        if (a.date===b.date && a.dx===b.dx && a.cbg===b.cbg)
          matching += `<line x1="${xs[i]}" y1="220" x2="${xs[i+1+k]}" y2="220" stroke="#b58144" stroke-width="3" stroke-dasharray="5 4"/>`;
      }));
      const nodes=group.map((x,i) => `<g class="v4-node" data-v4case="${esc(x.id)}" tabindex="0" role="button" aria-label="Buka ${esc(x.id)}">
        <rect x="${xs[i]-55}" y="145" width="110" height="64" rx="9" stroke="${x.id===c.id?'#087d77':'#aabac0'}" fill="${x.id===c.id?'#dbefea':'#edf2f4'}" stroke-width="${x.id===c.id?2.5:1.3}"/>
        <text x="${xs[i]}" y="165" text-anchor="middle" font-size="13" font-weight="bold" fill="#183744">${esc(x.id)}</text>
        <text x="${xs[i]}" y="181" text-anchor="middle" font-size="11" fill="#536b75">${esc(x.dx)}</text>
        <text x="${xs[i]}" y="195" text-anchor="middle" font-size="10" fill="#536b75">${esc(x.date)}</text></g>`).join('');
      return `<div class="card"><div class="v4-title"><h2>Claim Relationship Explorer</h2><span class="v4-tag">${group.length} klaim terkait</span></div>
        <p class="muted">Klik node klaim untuk menelusuri riwayat peserta simulasi.</p>
        <div class="v4-chart"><svg viewBox="0 0 920 255" width="100%" role="img" aria-label="Graf relasi klaim peserta sintetis">
        ${edges}${matching}<rect x="385" y="13" width="150" height="54" rx="9" stroke="#087d77" fill="#deefed" stroke-width="2"/>
        <text x="460" y="35" text-anchor="middle" font-size="15" font-weight="700" fill="#183744">${esc(c.participant)}</text>
        <text x="460" y="51" text-anchor="middle" font-size="11" fill="#536b75">Peserta simulasi</text>${nodes}</svg></div>
        <p class="muted">Garis abu-abu = peserta yang sama; garis putus-putus = tanggal, diagnosis, dan INA-CBG yang sama. Hubungan bukan bukti kecurangan.</p></div>`;
    }

    function explain(c) {
      const r=analyze(c), findings=[];
      if(r.sameDay>0) findings.push(`${r.sameDay} kunjungan lain memiliki tanggal dan diagnosis sama`);
      if(r.sameCBG>0) findings.push(`${r.sameCBG} kunjungan lain juga memiliki kode INA-CBG sama`);
      if(r.exactAmountMatches>0) findings.push(`${r.exactAmountMatches} kunjungan lain mempunyai nominal tagihan identik`);
      if(r.guardrail && r.guardrail!=='None') findings.push(`Perlindungan konteks diterapkan: ${r.guardrail}`);
      if(!findings.length) findings.push('Tidak ada sinyal pengulangan yang kuat pada klaim ini');
      return `<div class="card"><h2>Explainable Risk Findings</h2>${findings.map(f=>`<div class="v4-finding">${esc(f)}</div>`).join('')}
       <div class="v4-warning">Graph Expert: <b>${pct(r.prior)}</b>. Hasil ini indeks model sintetis, bukan probabilitas fraud riil atau tuduhan terhadap fasilitas kesehatan.</div></div>`;
    }

    function workflow(c) {
      const current=currentStatus(c.id), history=state.statusHistory.filter(x=>x.caseId===c.id);
      return `<div class="card"><h2>Case Workflow & Status History</h2>
        <form id="v4-status-form"><label for="v4-status-select">Status kasus</label>
        <select id="v4-status-select" name="status">${STATUS.map(s=>`<option value="${s}" ${s===current?'selected':''}>${s}</option>`).join('')}</select>
        <label for="v4-status-note">Alasan perubahan status</label>
        <input id="v4-status-note" name="note" maxlength="500" placeholder="Alasan tindak lanjut (simulasi)">
        <button class="primary" type="submit">Simpan status</button></form>
        <hr><h2>Riwayat Status</h2>${history.length?history.map(h=>`<div class="v4-history"><b>${esc(h.from)} → ${esc(h.to)}</b><div class="muted">${esc(h.date)}</div><div>${esc(h.note||'Tidak ada catatan')}</div></div>`).join(''):'<p class="muted">Belum ada perubahan status.</p>'}</div>`;
    }

    const prevDetail=detail;
    detail=function(){
      const markup=prevDetail();
      const c=state.cases.find(x=>x.id===selected);
      if(!c) return markup;
      const pos=markup.indexOf('<div class="details">');
      const addons=relationship(c)+explain(c);
      return (pos<0?markup+addons:markup.slice(0,pos)+addons+markup.slice(pos))+workflow(c);
    };

    const prevHome=home;
    home=function(){
      const counts=Object.fromEntries(STATUS.map(s=>[s,0]));
      state.cases.forEach(c=>counts[currentStatus(c.id)]++);
      return `<div class="card"><h2>Auditor Case Workflow</h2><div class="v4-grid">${STATUS.map(s=>`<div class="v4-metric"><span>${s}</span><b>${counts[s]}</b></div>`).join('')}</div></div>`+prevHome();
    };

    const prevQueueTable=queueTable;
    queueTable=function(items){
      // Keep all original columns and links, append an additional status column.
      let markup=prevQueueTable(items);
      markup=markup.replace('</thead>', '<th>Status</th></thead>');
      const rowStatuses=items.map(({c})=>`<td><span class="v4-tag">${esc(currentStatus(c.id))}</span></td>`);
      let row=0;
      markup=markup.replace(/<\/tr>/g,(match, offset)=>{
        // Headers appear before tbody, so only append status to rows inside tbody.
        const pre=markup.slice(0,offset);
        if(pre.lastIndexOf('<tbody')>pre.lastIndexOf('</tbody>') && row<rowStatuses.length) {
          return rowStatuses[row++]+'</tr>';
        }
        return match;
      });
      return markup;
    };

    const prevSaveDecision=saveDecision;
    saveDecision=function(event){
      const f=new FormData(event.currentTarget), act=String(f.get('action')||'');
      const note=String(f.get('note')||'').trim(), id=selected;
      prevSaveDecision(event);
      if(!note) return;
      const next={'Verifikasi lanjutan':'Under Review','Klarifikasi peserta':'Pending Evidence',
        'Verifikasi dokumen faskes':'Under Review','Tidak ada indikasi lanjutan':'Closed'}[act];
      if(next){changeStatus(id,next,'Tindak lanjut auditor: '+act);render();}
    };

    let budget=10;
    function budgetResult(){
      const all=state.cases.map(c=>({c,r:analyze(c)}));
      if(!all.length) return '<p class="muted">Belum ada kasus sintetis.</p>';
      const slots=Math.max(1,Math.ceil(all.length*budget/100));
      const byGraph=[...all].sort((a,b)=>b.r.prior-a.r.prior).slice(0,slots);
      const byEvidence=[...all].sort((a,b)=>b.r.posterior-a.r.posterior).slice(0,slots);
      const beforeIDs=new Set(byGraph.map(x=>x.c.id));
      const moved=byEvidence.filter(x=>!beforeIDs.has(x.c.id)).length;
      const money=byEvidence.reduce((sum,x)=>sum+Number(x.c.amount),0);
      const makeRows=(data,key)=>`<table><thead><tr><th>Klaim</th><th>Indeks</th><th>Status</th></tr></thead><tbody>${data.map(x=>`<tr><td><button class="v4-link" data-v4case="${esc(x.c.id)}">${esc(x.c.id)}</button></td><td>${pct(x.r[key])}</td><td>${esc(currentStatus(x.c.id))}</td></tr>`).join('')}</tbody></table>`;
      return `<div class="v4-grid">
        <div class="v4-metric"><span>Kasus sintetis</span><b>${all.length}</b></div>
        <div class="v4-metric"><span>Slot audit</span><b>${slots}</b></div>
        <div class="v4-metric"><span>Kasus berubah dalam antrean</span><b>${moved}</b></div>
        <div class="v4-metric"><span>Nilai klaim antrean</span><b style="font-size:17px">${currency(money)}</b></div>
      </div><div style="height:20px"></div><div class="v4-split">
        <div class="card"><h2>Graph Expert Only</h2>${makeRows(byGraph,'prior')}</div>
        <div class="card"><h2>Graph + Evidence Expert</h2>${makeRows(byEvidence,'posterior')}</div>
      </div><div class="v4-warning">Simulasi kapasitas dan perubahan antrean pada data sintetis. Nominal bukan estimasi penghematan; tidak ada label fraud terverifikasi.</div>`;
    }
    function budgetView(){
      return `<div class="card"><h2>Audit Capacity Simulator</h2><p>Atur proporsi klaim yang dapat ditelaah auditor, lalu bandingkan antrean sebelum dan sesudah konfirmasi peserta.</p>
        <label for="v4-budget-input">Kapasitas audit: <strong id="v4-budget-label">${budget}%</strong></label>
        <input id="v4-budget-input" type="range" min="10" max="100" step="10" value="${budget}">
        <p class="muted">Perubahan evidensi pada Audit Queue dapat memengaruhi urutan prioritas di sini.</p>
      </div><div id="v4-budget-output">${budgetResult()}</div>`;
    }

    const anchor=document.getElementById('nav-data') || document.getElementById('nav-about');
    if (!document.getElementById('nav-budget')) {
      const button=document.createElement('button');
      button.id='nav-budget';button.type='button';button.textContent='Audit Budget Simulator';
      button.addEventListener('click',()=>navigate('budget'));
      if(anchor) anchor.before(button); else nav.appendChild(button);
    }

    const prevRender=render;
    render=function(){
      if(view!=='budget') return prevRender();
      document.getElementById('heading').textContent='Audit Budget Simulator';
      document.getElementById('subheading').textContent='Efisiensi antrean pemeriksaan dengan kapasitas terbatas';
      document.querySelectorAll('nav button').forEach(el=>el.classList.remove('active'));
      document.getElementById('nav-budget').classList.add('active');
      document.getElementById('content').innerHTML=budgetView();
    };

    // Global event delegation for SVG nodes and status form.
    document.addEventListener('click',event=>{
      const target=event.target.closest('[data-v4case]');
      if(!target)return;
      const id=target.getAttribute('data-v4case');
      if(state.cases.some(c=>c.id===id)) review(id);
    });
    document.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      const target=event.target.closest('g[data-v4case]');
      if(!target)return;
      event.preventDefault();
      const id=target.getAttribute('data-v4case');
      if(state.cases.some(c=>c.id===id))review(id);
    });
    document.addEventListener('submit',event=>{
      if(event.target.id!=='v4-status-form')return;
      event.preventDefault();
      const values=new FormData(event.target);
      changeStatus(selected,String(values.get('status')),String(values.get('note')||''));
      render();
    });
    document.addEventListener('input',event=>{
      if(event.target.id!=='v4-budget-input')return;
      budget=Number(event.target.value);
      document.getElementById('v4-budget-label').textContent=budget+'%';
      document.getElementById('v4-budget-output').innerHTML=budgetResult();
    });

    render();
    console.info('SAKSI-JKN v4 loaded successfully.');
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootstrap,{once:true});
  else bootstrap();
})();
