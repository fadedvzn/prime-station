(()=>{
'use strict';
const boot=()=>{
 if(document.getElementById('prime-jarvis'))return;
 const style=document.createElement('style');
 style.textContent=`
 #prime-jarvis{position:fixed;right:20px;bottom:20px;z-index:9999;width:min(390px,calc(100vw - 28px));color:#eaf4ff;font:14px Inter,system-ui,sans-serif}
 #prime-jarvis *{box-sizing:border-box}
 #prime-jarvis .j-panel{border:1px solid #31516e;border-radius:18px;overflow:hidden;background:linear-gradient(155deg,#101f32f5,#080f1bf7);box-shadow:0 18px 60px #000a,0 0 28px #58cfff20;backdrop-filter:blur(18px)}
 #prime-jarvis .j-head{display:flex;align-items:center;gap:10px;padding:13px 15px;border-bottom:1px solid #263d56;background:linear-gradient(90deg,#12283e,#0b1728)}
 #prime-jarvis .j-orb{width:35px;height:35px;border-radius:50%;display:grid;place-items:center;border:1px solid #79dcff;color:#9ceaff;font:900 15px Orbitron,Inter,sans-serif;box-shadow:0 0 18px #57caff66,inset 0 0 12px #57caff22}
 #prime-jarvis .j-title{font:800 12px Orbitron,Inter,sans-serif;letter-spacing:2px}
 #prime-jarvis .j-sub{font-size:10px;color:#8eabc5;margin-top:3px}
 #prime-jarvis .j-ready{margin-left:auto;color:#83e6c1;font:700 9px Orbitron,sans-serif;letter-spacing:1px}
 #prime-jarvis .j-min{border:0;background:transparent;color:#a9c4db;font-size:19px;cursor:pointer;padding:4px 7px}
 #prime-jarvis .j-body{padding:12px}
 #prime-jarvis .j-log{height:260px;overflow:auto;display:flex;flex-direction:column;gap:9px;padding:2px 2px 10px}
 #prime-jarvis .j-msg{max-width:92%;padding:10px 12px;border:1px solid #263d56;border-radius:12px;background:#12243a;color:#e4f1ff;line-height:1.5;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}
 #prime-jarvis .j-msg.user{align-self:flex-end;background:#12364b;border-color:#28627b}
 #prime-jarvis .j-msg.assistant{align-self:flex-start}
 #prime-jarvis .j-msg.system{align-self:center;background:transparent;border:0;color:#8ca8c2;font-size:10px;text-align:center;padding:4px}
 #prime-jarvis .j-controls{display:grid;grid-template-columns:1fr 54px;gap:8px}
 #prime-jarvis .j-input{width:100%;min-width:0;background:#081321;border:1px solid #2b4561;border-radius:11px;padding:11px 12px;color:#edf7ff;font:13px Inter,system-ui,sans-serif;outline:none}
 #prime-jarvis .j-input:focus{border-color:#72d9ff;box-shadow:0 0 0 2px #72d9ff20}
 #prime-jarvis .j-send{border:1px solid #68cfff;border-radius:11px;background:#173b53;color:#bceeff;font-weight:800;font-size:17px;cursor:pointer}
 #prime-jarvis .j-send:disabled{opacity:.45;cursor:wait}
 #prime-jarvis .j-bottom{display:flex;align-items:center;gap:9px;margin-top:9px}
 #prime-jarvis .j-talk{flex:1;min-height:42px;border:1px solid #58caff;border-radius:11px;background:linear-gradient(100deg,#123e59,#0e2b43);color:#c9f4ff;font:800 10px Orbitron,Inter,sans-serif;letter-spacing:1.1px;cursor:pointer;touch-action:none;user-select:none}
 #prime-jarvis .j-talk.listening{background:linear-gradient(100deg,#6b2635,#351b2b);border-color:#ff8295;color:#ffe3e8;box-shadow:0 0 20px #ff829533}
 #prime-prime .j-talk:focus-visible,#prime-jarvis button:focus-visible{outline:2px solid #fff;outline-offset:2px}
 #prime-jarvis .j-speak{border:1px solid #2c4965;background:#0b1929;color:#9fc9e5;border-radius:10px;padding:9px 10px;font-size:10px;cursor:pointer}
 #prime-jarvis .j-foot{font-size:9px;color:#7896b1;margin-top:8px;text-align:center}
 #prime-jarvis.collapsed .j-body{display:none}
 @media(max-width:520px){#prime-jarvis{right:10px;bottom:10px}#prime-jarvis .j-log{height:210px}}
 `;
 document.head.appendChild(style);
 const root=document.createElement('section');root.id='prime-jarvis';
 root.innerHTML=`<div class="j-panel"><div class="j-head"><div class="j-orb">P</div><div><div class="j-title">JARVIS</div><div class="j-sub">PRIME STATION INTELLIGENCE</div></div><div class="j-ready" id="j-status">READY</div><button class="j-min" id="j-min" aria-label="Minimize JARVIS">−</button></div><div class="j-body"><div class="j-log" id="j-log" aria-live="polite"><div class="j-msg assistant">Systems ready. I'm JARVIS, your Prime Station assistant. Type a request or hold the microphone button while you speak.</div></div><form id="j-form"><div class="j-controls"><input class="j-input" id="j-input" maxlength="4000" autocomplete="off" placeholder="Ask JARVIS anything…" aria-label="Message JARVIS"><button class="j-send" id="j-send" aria-label="Send message">➤</button></div></form><div class="j-bottom"><button class="j-talk" id="j-talk" type="button">▣ &nbsp; HOLD TO TALK</button><button class="j-speak" id="j-speak" type="button">VOICE ON</button></div><div class="j-foot">PUSH TO TALK • TEXT CHAT • OWNER AUTHENTICATION REQUIRED</div></div></div>`;
 document.body.appendChild(root);
 const $=id=>document.getElementById(id),log=$('j-log'),input=$('j-input'),sendBtn=$('j-send'),talk=$('j-talk'),status=$('j-status');
 let busy=false,voiceOn=true,recognition=null,voiceTranscript='';
 const add=(kind,text)=>{const el=document.createElement('div');el.className='j-msg '+kind;el.textContent=text;log.appendChild(el);log.scrollTop=log.scrollHeight;};
 const speak=text=>{if(!voiceOn||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.slice(0,1800));u.rate=1.02;u.pitch=1;window.speechSynthesis.speak(u);};
 async function send(text){
  const prompt=String(text||'').trim();if(!prompt||busy)return;
  busy=true;sendBtn.disabled=true;status.textContent='THINKING';add('user',prompt);
  try{
   const res=await fetch('/api/jarvis',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.error||(res.status===401?'Please sign in as the Prime Station owner first.':'JARVIS request failed.'));
   const answer=data.text||'I received your request, but there was no response.';
   add('assistant',answer);speak(answer);
  }catch(e){add('system',e.message||'Could not reach JARVIS.');}
  finally{busy=false;sendBtn.disabled=false;status.textContent='READY';input.focus();}
 }
 $('j-form').addEventListener('submit',e=>{e.preventDefault();const v=input.value;input.value='';send(v);});
 $('j-min').addEventListener('click',()=>{root.classList.toggle('collapsed');$('j-min').textContent=root.classList.contains('collapsed')?'+':'−';});
 $('j-speak').addEventListener('click',()=>{voiceOn=!voiceOn;$('j-speak').textContent=voiceOn?'VOICE ON':'VOICE OFF';if(!voiceOn&&'speechSynthesis'in window)window.speechSynthesis.cancel();});
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(SR){
  recognition=new SR();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;
  recognition.onstart=()=>{voiceTranscript='';talk.classList.add('listening');talk.textContent='● LISTENING — RELEASE TO SEND';status.textContent='LISTENING';};
  recognition.onresult=e=>{voiceTranscript=Array.from(e.results).map(r=>r[0].transcript).join(' ').trim();};
  recognition.onerror=e=>{if(e.error!=='no-speech'&&e.error!=='aborted')add('system','Microphone: '+e.error+'. Check browser microphone permission.');};
  recognition.onend=()=>{talk.classList.remove('listening');talk.textContent='▣  HOLD TO TALK';status.textContent='READY';if(voiceTranscript){input.value=voiceTranscript;const v=voiceTranscript;voiceTranscript='';send(v);}};
  const start=()=>{if(busy||talk.classList.contains('listening'))return;try{recognition.start();}catch(e){}};
  const stop=()=>{if(talk.classList.contains('listening')){try{recognition.stop();}catch(e){}}};
  talk.addEventListener('pointerdown',e=>{e.preventDefault();talk.setPointerCapture?.(e.pointerId);start();});
  talk.addEventListener('pointerup',e=>{e.preventDefault();stop();});
  talk.addEventListener('pointercancel',stop);
  talk.addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat){e.preventDefault();start();}});
  talk.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();stop();}});
 }else{
  talk.textContent='VOICE INPUT UNAVAILABLE';
  talk.disabled=true;
  talk.title='Use Microsoft Edge or Chrome with speech recognition support.';
  add('system','Voice input is not supported by this browser. Text chat is ready.');
 }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();