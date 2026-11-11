/* NO-SITE CLINIC 문의 위젯 — 데모 사이트에 한 줄로 붙이면 '제작 문의' 버튼이 생깁니다.
   <script src="https://jake12733.github.io/nosite-clinic/widget.js" data-hospital="병원명" defer></script>
   옵션: data-key="대시보드 병원 키", data-label="버튼 문구", data-color="#d4af37" */
(() => {
  if (window.__nositeWidget) return; window.__nositeWidget = 1;
  const me = document.currentScript || [...document.scripts].find(s => /nosite-clinic\/widget\.js/.test(s.src));
  const ds = (me && me.dataset) || {};
  const FN = 'https://crrsswrrdpzmdlrgkfoi.supabase.co/functions/v1/nosite-inbox';
  const H = ds.hospital || '', KEY = ds.key || '', LABEL = ds.label || '홈페이지 제작 문의', C = ds.color || '#d4af37';
  const css = `
  .nsw-btn{position:fixed;right:18px;bottom:18px;z-index:2147483000;display:flex;align-items:center;gap:8px;height:50px;padding:0 18px;border:0;border-radius:25px;background:#0b131f;color:#fff;font:700 14px/1 "Pretendard",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3);cursor:pointer}
  .nsw-btn i{width:9px;height:9px;border-radius:50%;background:${C};box-shadow:0 0 0 4px ${C}44}
  .nsw-ov{position:fixed;inset:0;z-index:2147483001;background:rgba(11,19,31,.55);display:none;align-items:flex-end;justify-content:center;padding:16px}
  .nsw-ov.on{display:flex}
  .nsw-box{width:100%;max-width:420px;background:#fff;border-radius:18px;padding:22px;font:14px/1.5 "Pretendard",system-ui,sans-serif;color:#0f172a;box-shadow:0 20px 60px rgba(0,0,0,.35);position:relative}
  @media(min-width:640px){.nsw-ov{align-items:center}}
  .nsw-box h3{font-size:18px;margin:0 0 4px}.nsw-box p{color:#64748b;font-size:13px;margin:0 0 14px}
  .nsw-box input,.nsw-box textarea{width:100%;box-sizing:border-box;font:inherit;font-size:15px;border:1px solid #d5dbe5;border-radius:10px;padding:11px 12px;margin:0 0 9px;outline:none;color:#0f172a;background:#fff}
  .nsw-box textarea{min-height:100px;resize:vertical}
  .nsw-box input:focus,.nsw-box textarea:focus{border-color:${C}}
  .nsw-go{width:100%;height:48px;border:0;border-radius:12px;background:#0b131f;color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
  .nsw-x{position:absolute;top:12px;right:12px;width:32px;height:32px;border:0;border-radius:8px;background:#f1f4f8;cursor:pointer;font-size:15px}
  .nsw-err{color:#e5484d;font-size:12.5px;min-height:16px;margin:2px 0 6px}
  .nsw-hp{position:absolute;left:-9999px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const btn = document.createElement('button'); btn.className = 'nsw-btn'; btn.type = 'button'; btn.innerHTML = '<i></i>' + LABEL;
  const ov = document.createElement('div'); ov.className = 'nsw-ov';
  ov.innerHTML = `<form class="nsw-box"><button type="button" class="nsw-x" aria-label="닫기">✕</button><h3>${LABEL}</h3><p>남겨주시면 담당자에게 바로 전달돼요.</p><input name="sender" maxlength="60" placeholder="성함 / 직책"><input name="contact" maxlength="120" placeholder="연락받을 번호 또는 이메일"><textarea name="message" maxlength="2000" placeholder="문의 내용 (예: 가격, 시안 수정, 상담 요청)" required></textarea><input class="nsw-hp" name="website" tabindex="-1" autocomplete="off"><div class="nsw-err"></div><button class="nsw-go" type="submit">문의 보내기</button></form>`;
  document.body.append(btn, ov);
  const f = ov.querySelector('form'), err = ov.querySelector('.nsw-err'), go = ov.querySelector('.nsw-go');
  btn.onclick = () => ov.classList.add('on');
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.nsw-x')) ov.classList.remove('on'); });
  f.addEventListener('submit', async e => {
    e.preventDefault(); err.textContent = '';
    const d = Object.fromEntries(new FormData(f).entries());
    if (!d.message || d.message.trim().length < 2) { err.textContent = '문의 내용을 적어주세요'; return; }
    go.disabled = true; go.textContent = '보내는 중...';
    try {
      const r = await fetch(FN, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'submit', hkey: KEY, hname: H || document.title, sender: d.sender, contact: d.contact, message: d.message, website: d.website, source: '데모 사이트', page: location.href }) });
      if (!r.ok) throw new Error((await r.json().catch(()=>({}))).error || '전송 실패');
      f.innerHTML = '<h3 style="margin:16px 0 6px;text-align:center">문의가 전달됐어요 ✓</h3><p style="text-align:center;margin-bottom:16px">빠르게 연락드릴게요. 감사합니다!</p><button type="button" class="nsw-go nsw-x2">닫기</button>';
      f.querySelector('.nsw-x2').onclick = () => ov.classList.remove('on');
    } catch (x) { err.textContent = x.message + ' · 잠시 후 다시 시도해 주세요'; go.disabled = false; go.textContent = '문의 보내기'; }
  });
})();
