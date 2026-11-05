(() => {
  'use strict';
  const files = {1:'cover1.mp4',2:'cover2.mp4',3:'cover4.mp4',4:'cover5.mp4',5:'cover6.mp4',6:'cover7.mp4',7:'cover8.mp4',8:'cover9.mp4',9:'intro.mp4'};
  const labels = {1:'动画曲线',2:'粒子与曲线',3:'MAD 打光',4:'三维元素融合',5:'三维融合二',6:'动画曲线二',7:'音乐展 PV',8:'分镜练习',9:'Showreel'};
  const params = new URLSearchParams(location.search);
  let source = ['bilibili','github','r2'].includes(params.get('source')) ? params.get('source') : 'bilibili';
  let base = localStorage.getItem('yaelum-r2-base') || '';
  const runs = [];
  let current = null;
  let stopCurrent = () => {};
  const style = document.createElement('style');
  style.textContent = '#hosting-panel{position:fixed;bottom:12px;left:12px;z-index:99999;background:#fff;color:#182c42;box-shadow:0 6px 32px #16324b35;border:1px solid #c3dbea;border-radius:14px;padding:12px;font:13px/1.5 system-ui;width:min(640px,calc(100vw - 48px));max-height:45vh;overflow:auto}#hosting-panel summary{cursor:pointer;font-weight:700}#hosting-panel button,#hosting-panel select,#hosting-panel input{font:inherit;padding:5px 9px;margin:4px;border:1px solid #adc9dc;border-radius:6px;background:#f4faff;color:#182c42}#hosting-panel input{width:70%}#hosting-status{white-space:pre-wrap;margin:6px 0}#hosting-table{border-collapse:collapse;width:100%;font-size:11px}#hosting-table td,#hosting-table th{border-bottom:1px solid #dbe5ee;padding:4px;text-align:left}#hosting-panel .hosting-note{font-size:11px;color:#546b7f}.modal-content video{background:#000}';
  document.head.append(style);
  const panel = document.createElement('details');
  panel.id = 'hosting-panel'; panel.open = true;
  panel.innerHTML = '<summary>视频托管对比 · 同一作品集页面</summary><div><label>来源 <select id="hosting-source"><option value="bilibili">B站（现版基准）</option><option value="github">GitHub Pages MP4</option><option value="r2">Cloudflare R2 MP4</option></select></label><label>作品 <select id="hosting-work"><option value="9">Showreel · 97秒 / 95MiB</option><option value="1">动画曲线 · 27秒 / 51MiB</option><option value="4">三维元素 · 35秒 / 63MiB</option><option value="3">MAD打光 · 87秒 / 14MiB</option></select></label><button id="hosting-play">打开所选作品</button><button id="hosting-close">关闭视频</button><button id="hosting-seek">跳至60%</button></div><div id="hosting-r2"><label>R2公开地址 <input id="hosting-base" type="url" placeholder="https://video.example.com"></label><button id="hosting-save">保存</button></div><div id="hosting-status" role="status"></div><div><button id="hosting-record">记录本次</button><button id="hosting-copy">复制测试记录</button><button id="hosting-download">下载测试记录</button></div><p class="hosting-note">MP4点击后才设置视频地址；关闭后停止下载。B站跨站播放器的首帧、缓冲和实际分辨率需单独观察，面板不会伪造这些数值。切换来源保留浏览器缓存；冷热缓存及网络条件请分别记录。</p><table id="hosting-table"><thead><tr><th>来源/作品</th><th>首帧</th><th>缓冲</th><th>分辨率</th><th>跳转</th></tr></thead><tbody></tbody></table>';
  document.body.append(panel);
  const q = s => panel.querySelector(s);
  q('#hosting-source').value = source; q('#hosting-base').value = base;
  function close() {
    document.querySelectorAll('.modal[style*="flex"] .close-btn').forEach(b => b.click());
  }
  function fmt(v) { return v == null ? '待测' : `${(v/1000).toFixed(2)}秒`; }
  function update() {
    q('#hosting-r2').hidden = source !== 'r2';
    if (!current) {q('#hosting-status').textContent = `当前：${source}。点击作品后开始记录。`; return;}
    const c = current;
    q('#hosting-status').textContent = c.source === 'bilibili' ? `B站基准 · ${c.work}\n已打开现版外嵌地址；播放器显示及首帧请单独观察。` : `${c.source} · ${c.work}\n首帧 ${fmt(c.firstFrameMs)}；开始播放 ${fmt(c.playingMs)}；缓冲 ${c.stalls}次 / ${fmt(c.stallMs)}\n实际分辨率 ${c.resolution || '待测'}；跳转恢复 ${fmt(c.seekMs)}${c.error ? '\n'+c.error : ''}`;
  }
  q('#hosting-source').onchange = e => {close(); source=e.target.value; current=null; const u=new URL(location.href);u.searchParams.set('source',source);history.replaceState(null,'',u);update();};
  q('#hosting-save').onclick = () => {
    const value = q('#hosting-base').value.trim().replace(/\/+$/,'');
    try { const u=new URL(value); if(u.protocol!=='https:' || u.username || u.password || u.search || u.hash) throw Error('invalid'); base=u.href.replace(/\/+$/,''); localStorage.setItem('yaelum-r2-base',base);current=null;update(); }
    catch { q('#hosting-status').textContent='请填入HTTPS公开根地址，不含密钥或签名参数。'; }
  };
  q('#hosting-play').onclick = () => {
    close();
    const p=q('#hosting-work').value;
    const el=p==='9'?document.getElementById('cover-container'):document.querySelector(`.work-card[data-type="video"][data-page="${p}"]`);
    el?.click();
  };
  q('#hosting-close').onclick = close;
  q('#hosting-seek').onclick = () => {const v=document.querySelector('.modal[style*="flex"] video');if(v && Number.isFinite(v.duration)){v.currentTime=v.duration*0.6;v.play().catch(()=>{});}};
  q('#hosting-record').onclick = () => {
    if(!current)return;
    const entry={...current,stallMs:current.stallMs,events:current.events.slice(),recordedAt:new Date().toISOString()};
    runs.push(entry);
    const tr=document.createElement('tr');
    for(const text of [`${entry.source} / ${entry.work}`,fmt(entry.firstFrameMs),`${entry.stalls} / ${fmt(entry.stallMs)}`,entry.resolution||'单独观察',fmt(entry.seekMs)]){const td=document.createElement('td');td.textContent=text;tr.append(td);}
    q('#hosting-table tbody').append(tr);
  };
  function report() {return JSON.stringify({page:location.href,userAgent:navigator.userAgent,connection:navigator.connection?{effectiveType:navigator.connection.effectiveType,downlink:navigator.connection.downlink,rtt:navigator.connection.rtt}:null,baseline:'Unchanged Bilibili iframe URL from current portfolio; source MP4 files copied byte-for-byte.',warning:'Bilibili iframe metrics are not measured by this page. MP4 source files may differ from Bilibili uploaded revisions; compare content before quality judgment.',runs,current},null,2);}
  q('#hosting-copy').onclick = async () => {try{await navigator.clipboard.writeText(report());q('#hosting-status').textContent+='\n已复制记录。';}catch{q('#hosting-status').textContent+='\n请使用下载测试记录。';}};
  q('#hosting-download').onclick = () => {const url=URL.createObjectURL(new Blob([report()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='yaelum-video-test.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  function setup(frame, p) {
    p=Number(p);
    stopCurrent();
    current={source,work:labels[p]||`P${p}`,file:files[p]||null,openedAt:new Date().toISOString(),firstFrameMs:null,playingMs:null,resolution:null,stalls:0,stallMs:0,seekMs:null,error:null,events:[]};
    if(source==='bilibili'){update();return false;}
    const run=current;
    if(!files[p]){run.error='此作品尚未找到对应本地MP4；本次保留B站，不计入MP4对比。';run.source='bilibili';update();return false;}
    if(source==='r2'&&!base){frame.remove();run.error='R2尚未配置公开视频地址。';update();return true;}
    const t0=performance.now();
    const video=document.createElement('video'); video.controls=true;video.playsInline=true;video.preload='none';video.dataset.hostingVideo='1';
    video.src=source==='github'?new URL(`video/${files[p]}`,location.href).href:`${base}/${files[p]}`;
    let first=false,waiting=null,seekingAt=null,wasPlaying=false,seeking=false;
    function log(type){run.events.push({type,ms:Math.round(performance.now()-t0),at:Math.round(video.currentTime*1000)/1000});}
    function endWait(){if(waiting!==null){run.stallMs+=performance.now()-waiting;waiting=null;}}
    video.addEventListener('loadedmetadata',()=>{run.resolution=`${video.videoWidth}×${video.videoHeight}`;run.duration=video.duration;log('loadedmetadata');update();});
    video.addEventListener('playing',()=>{log('playing');if(run.playingMs===null)run.playingMs=performance.now()-t0;wasPlaying=true;endWait();if(seekingAt!==null){run.seekMs=performance.now()-seekingAt;seekingAt=null;}if(!video.requestVideoFrameCallback&&!first){first=true;run.firstFrameMs=performance.now()-t0;run.firstFrameMethod='playing-event-fallback';}update();});
    if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(()=>{first=true;run.firstFrameMs=performance.now()-t0;run.firstFrameMethod='requestVideoFrameCallback';update();});
    video.addEventListener('waiting',()=>{log('waiting');if(wasPlaying&&!video.paused&&!seeking&&waiting===null){waiting=performance.now();run.stalls++;}update();});
    video.addEventListener('seeking',()=>{seeking=true;seekingAt=performance.now();endWait();log('seeking');});
    video.addEventListener('seeked',()=>{seeking=false;log('seeked');if(!video.paused&&video.readyState>=3&&seekingAt!==null){run.seekMs=performance.now()-seekingAt;seekingAt=null;}update();});
    video.addEventListener('pause',()=>{endWait();log('pause');update();});
    video.addEventListener('ended',()=>{endWait();log('ended');update();});
    video.addEventListener('error',()=>{run.error=`播放错误 ${video.error?.code||''}`;log('error');update();});
    frame.replaceWith(video);
    const result=video.play();if(result)result.catch(error=>{run.error=`请点击播放器播放：${error.name}`;update();});
    stopCurrent=()=>{endWait();video.pause();video.removeAttribute('src');video.load();video.remove();stopCurrent=()=>{};};
    update();
    return true;
  }
  window.yaelumHostingOpen=setup;
  new MutationObserver(()=>{
    const modalOpen=Array.from(document.querySelectorAll('.modal')).some(m=>m.style.display==='flex');
    if(!modalOpen)stopCurrent();
  }).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src','style']});
  update();
})();
