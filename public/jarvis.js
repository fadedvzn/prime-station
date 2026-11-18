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
 #prime-jarvis .j-bottom{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:9px}
 #prime-jarvis .j-talk{flex:1;min-height:42px;border:1px solid #58caff;border-radius:11px;background:linear-gradient(100deg,#123e59,#0e2b43);color:#c9f4ff;font:800 10px Orbitron,Inter,sans-serif;letter-spacing:1.1px;cursor:pointer;touch-action:none;user-select:none}
 #prime-jarvis .j-talk.listening{background:linear-gradient(100deg,#6b2635,#351b2b);border-color:#ff8295;color:#ffe3e8;box-shadow:0 0 20px #ff829533}
 #prime-jarvis .j-talk:focus-visible,#prime-jarvis button:focus-visible{outline:2px solid #fff;outline-offset:2px}
 #prime-jarvis .j-speak,#prime-jarvis .j-alert{border:1px solid #2c4965;background:#0b1929;color:#9fc9e5;border-radius:10px;padding:8px 6px;font-size:9px;cursor:pointer;font-weight:800}
 #prime-jarvis .j-assign{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px}#prime-jarvis .j-assign input,#prime-jarvis .j-assign select,#prime-jarvis .j-assign textarea{min-width:0;width:100%;background:#081321;color:#d9efff;border:1px solid #2b4561;border-radius:8px;padding:8px;font:10px Inter,system-ui}#prime-jarvis .j-assign textarea{grid-column:1/-1;resize:vertical;min-height:48px}#prime-jarvis .j-assign button{grid-column:1/-1;border:1px solid #3c9cc3;background:#103149;color:#c9efff;border-radius:8px;padding:8px;font:800 9px Orbitron,Inter,sans-serif;letter-spacing:.8px;cursor:pointer}#prime-jarvis .j-foot{font-size:9px;color:#7896b1;margin-top:8px;text-align:center}
 #prime-jarvis.collapsed .j-body{display:none}
 @media(max-width:520px){#prime-jarvis{right:10px;bottom:10px}#prime-jarvis .j-log{height:210px}}
 `;
 document.head.appendChild(style);
 const root=document.createElement('section');root.id='prime-jarvis';
 root.innerHTML=`<div class="j-panel"><div class="j-head"><div class="j-orb">P</div><div><div class="j-title">DEXTOR</div><div class="j-sub">PRIME STATION COMMAND AI</div></div><div class="j-ready" id="j-status">READY</div><button class="j-min" id="j-min" aria-label="Minimize DEXTOR">−</button></div><div class="j-body"><div class="j-log" id="j-log" aria-live="polite"><div class="j-msg assistant">Systems ready. I'm DEXTOR, your Prime Station assistant. Type a request or hold the microphone button while you speak.</div></div><form id="j-form"><div class="j-controls"><input class="j-input" id="j-input" maxlength="4000" autocomplete="off" placeholder="Ask DEXTOR… use research: for web research" aria-label="Message DEXTOR"><button class="j-send" id="j-send" aria-label="Send message">➤</button></div></form><div class="j-bottom"><button class="j-talk" id="j-talk" type="button">▣ &nbsp; HOLD TO TALK</button><button class="j-speak" id="j-speak" type="button">WAKE: OFF</button><button class="j-alert" id="j-alert" type="button">CHIME: OFF</button></div><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px"><label for="j-output" style="font-size:10px;color:#9db6cc">RESPONSE MODE</label><select id="j-output" style="background:#081321;color:#d9efff;border:1px solid #2b4561;border-radius:8px;padding:7px;font-size:10px"><option value="both">Text + spoken</option><option value="text">Text only</option><option value="voice">Spoken only</option></select></div><div class="j-foot" id="j-foot">MIC OFF • SAY “HEY DEXTOR” • KEEP THIS TAB OPEN FOR WAKE MODE</div></div></div>`;
 document.body.appendChild(root);
 const $=id=>document.getElementById(id),log=$('j-log'),input=$('j-input'),sendBtn=$('j-send'),talk=$('j-talk'),status=$('j-status');
 let busy=false,voiceOn=true,recognition=null,voiceTranscript='',wakeEnabled=false,outputMode='both',holdActive=false,alertsEnabled=false,audioCtx=null;const taskStatuses=new Map();
 const add=(kind,text)=>{const el=document.createElement('div');el.className='j-msg '+kind;el.textContent=text;log.appendChild(el);log.scrollTop=log.scrollHeight;};
 const speak=text=>{if(!['both','voice'].includes(outputMode)||!('speechSynthesis'in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.slice(0,1800));u.rate=1.02;u.pitch=1;window.speechSynthesis.speak(u);};
 async function send(text){
  const prompt=String(text||'').trim();if(!prompt||busy)return;
  busy=true;sendBtn.disabled=true;status.textContent='THINKING';add('user',prompt);
  try{
   const res=await fetch('/api/jarvis',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});
   const data=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(data.error||(res.status===401?'Please sign in as the Prime Station owner first.':'DEXTOR request failed.'));
   const answer=data.text||'I received your request, but there was no response.';
   if(outputMode!=='voice')add('assistant',answer);speak(answer);
  }catch(e){add('system',e.message||'Could not reach DEXTOR.');}
  finally{busy=false;sendBtn.disabled=false;status.textContent='READY';input.focus();}
 }
 $('j-form').addEventListener('submit',e=>{e.preventDefault();const v=input.value;input.value='';send(v);});
 $('j-assign-btn').addEventListener('click',async()=>{const agent=$('j-agent').value,title=$('j-task-title').value.trim(),prompt=$('j-task-prompt').value.trim();if(title.length<3||prompt.length<10){add('system','Enter a task title and at least 10 characters of instructions.');return;}try{const r=await fetch('/api/jarvis/assign',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({agent,title,prompt})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not assign task.');add('system',d.name+' received task: '+title+' (queued).');$('j-task-title').value='';$('j-task-prompt').value='';}catch(e){add('system',e.message||'Could not assign task.');}});
 $('j-min').addEventListener('click',()=>{root.classList.toggle('collapsed');$('j-min').textContent=root.classList.contains('collapsed')?'+':'−';});
 $('j-output').addEventListener('change',e=>{outputMode=e.target.value;if(outputMode==='text'&&'speechSynthesis'in window)window.speechSynthesis.cancel();});
 function playChime(){const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;if(!audioCtx)audioCtx=new Ctx();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime;[880,1174].forEach((hz,i)=>{const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),start=now+i*.16;osc.type='sine';osc.frequency.setValueAtTime(hz,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.10,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+.22);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(start);osc.stop(start+.24);});}
 async function checkAgentTasks(){try{const r=await fetch('/api/tasks',{credentials:'same-origin'});if(!r.ok)return;const d=await r.json();for(const t of d.tasks||[]){const prev=taskStatuses.get(t.id);if(prev&&prev!==t.status&&['review','failed','approved','published'].includes(t.status)){if(alertsEnabled){playChime();add('system',t.title+' · '+t.status.toUpperCase());}}taskStatuses.set(t.id,t.status);}}catch(e){}}
 $('j-alert').addEventListener('click',()=>{alertsEnabled=!alertsEnabled;$('j-alert').textContent=alertsEnabled?'CHIME: ON':'CHIME: OFF';if(alertsEnabled){playChime();add('system','Agent completion chime enabled. Keep Prime Station open to hear task updates.');}else add('system','Agent completion chime disabled.');});
 checkAgentTasks();setInterval(checkAgentTasks,15000);

 $('j-speak').addEventListener('click',()=>{if(!recognition){add('system','Wake-word listening is not supported by this browser.');return;}wakeEnabled=!wakeEnabled;$('j-speak').textContent=wakeEnabled?'WAKE LISTENING: ON':'WAKE LISTENING: OFF';$('j-speak').classList.toggle('listening',wakeEnabled);$('j-speak').setAttribute('aria-pressed',String(wakeEnabled));$('j-foot').textContent=wakeEnabled?'MIC ACTIVE • SAY “HEY DEXTOR” • THIS TAB MUST STAY OPEN':'MIC OFF • SAY “HEY DEXTOR” • KEEP THIS TAB OPEN FOR WAKE MODE';if(wakeEnabled){try{recognition.start();}catch(e){add('system','Allow microphone access, then try again.');}}else{try{recognition.stop();}catch(e){}}});
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(SR){
  recognition=new SR();recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=false;
  recognition.onstart=()=>{if(!wakeEnabled){voiceTranscript='';holdActive=true;talk.classList.add('listening');talk.textContent='● LISTENING — RELEASE TO SEND';status.textContent='LISTENING';}else{status.textContent='WAKE LISTENING';}};
  recognition.onresult=e=>{for(let i=e.resultIndex;i<e.results.length;i++){if(!e.results[i].isFinal)continue;const transcript=String(e.results[i][0]?.transcript||'').trim();if(!transcript)continue;if(wakeEnabled&&!holdActive){const low=transcript.toLowerCase(),idx=low.indexOf('hey dextor');if(idx>=0){const cmd=transcript.slice(idx+10).trim();if(cmd)send(cmd);else add('system','I’m listening. What would you like me to do?');}}else if(holdActive){voiceTranscript+=(voiceTranscript?' ':'')+transcript;}}};
  recognition.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){wakeEnabled=false;$('j-speak').textContent='WAKE LISTENING: OFF';$('j-speak').classList.remove('listening');$('j-foot').textContent='MIC BLOCKED • ENABLE MICROPHONE PERMISSION IN EDGE';status.textContent='MIC BLOCKED';}else if(e.error!=='no-speech'&&e.error!=='aborted')add('system','Microphone: '+e.error+'. Check browser microphone permission.');};
  recognition.onend=()=>{talk.classList.remove('listening');talk.textContent='▣  HOLD TO TALK';if(holdActive){holdActive=false;if(voiceTranscript){input.value=voiceTranscript;const v=voiceTranscript;voiceTranscript='';send(v);}}if(wakeEnabled){status.textContent='WAKE LISTENING';setTimeout(()=>{if(wakeEnabled)try{recognition.start();}catch(e){}},650);}else status.textContent='READY';};
  const start=()=>{if(busy||wakeEnabled||talk.classList.contains('listening'))return;voiceTranscript='';holdActive=true;try{recognition.start();}catch(e){holdActive=false;add('system','Microphone is busy or unavailable. Turn off wake listening first.');}};
  const stop=()=>{if(holdActive){try{recognition.stop();}catch(e){}}};
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