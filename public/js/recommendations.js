document.addEventListener('DOMContentLoaded',function(){initRecommendationForm();initDiscussionFilters();initHeroDiscussionStats();initAdminCommands();loadDiscussions({page:1});});
function initRecommendationForm(){const form=document.getElementById('recommendation-form');if(!form)return;form.addEventListener('submit',async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());const btn=form.querySelector('button[type="submit"]');const old=btn.innerHTML;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Submitting...';btn.disabled=true;try{const res=await fetch('/api/recommendations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await res.json();if(!res.ok)throw new Error(out.error||'Failed');alert(out.message||'Submitted!');form.reset();
      // refresh stats and list after a successful submission
      if(typeof initHeroDiscussionStats==='function') initHeroDiscussionStats();
      loadDiscussions({page:1});
    }catch(err){alert('Submission failed');}finally{btn.innerHTML=old;btn.disabled=false;}});} 
async function initHeroDiscussionStats(){
  const container = document.querySelector('.hero-stats');
  if(!container) return;
  try{
    const res = await fetch('/api/recommendations?limit=1000');
    const data = await res.json();
    if(!res.ok) throw new Error(data.error||'Failed');
    const list = data.recommendations||[];
    const discussions = data.totalRecommendations ?? list.length;
    const contributors = new Set(list.map(r=> (r.email||'').toLowerCase()).filter(Boolean)).size;
    const topics = new Set(list.map(r=> r.topic||'')).size;
    // Map by label text to the correct number element
    container.querySelectorAll('.stat-item').forEach(item=>{
      const label = (item.querySelector('.stat-label')?.textContent||'').trim().toLowerCase();
      const numEl = item.querySelector('.stat-number');
      if(!numEl) return;
      if(label.includes('discussion')) numEl.textContent = String(discussions);
      else if(label.includes('contributor')) numEl.textContent = String(contributors);
      else if(label.includes('topic')) numEl.textContent = String(topics);
    });
  }catch(e){/* leave defaults if API fails */}

function initAdminCommands(){
  const form = document.getElementById('admin-command-form');
  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    // coerce checkbox to boolean
    data.isAnnouncement = form.querySelector('#admin-is-announcement')?.checked || false;
    const btn=form.querySelector('button[type="submit"]');
    const old=btn.innerHTML; btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Posting...'; btn.disabled=true;
    try{
      const res = await fetch('/api/recommendations',{
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data)
      });
      const out = await res.json();
      if(!res.ok) throw new Error(out.error||'Failed to post');
      alert(out.message || 'Announcement posted');
      form.reset();
      if(typeof initHeroDiscussionStats==='function') initHeroDiscussionStats();
      loadDiscussions({page:1});
    }catch(err){
      alert('Failed to post announcement. Check your Admin Token.');
    }finally{
      btn.innerHTML=old; btn.disabled=false;
    }
  });
}
}
function initDiscussionFilters(){
  const buttons = document.querySelectorAll('.discussion-filters .filter-btn');
  buttons.forEach(btn=>{
    btn.addEventListener('click',()=>{
      buttons.forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      loadDiscussions({page:1,filter:btn.getAttribute('data-filter')});
    });
  });
  const loadMore=document.getElementById('load-more-discussions');
  if(loadMore){
    loadMore.addEventListener('click',()=>{
      const page=parseInt(loadMore.dataset.page||'1',10)+1;
      const filter=document.querySelector('.discussion-filters .filter-btn.active')?.getAttribute('data-filter')||'all';
      loadDiscussions({page,filter},true);
    });
  }
}
async function loadDiscussions(params={},append){const grid=document.getElementById('discussions-grid');const loadMore=document.getElementById('load-more-discussions');if(!grid)return;const q=new URLSearchParams(params).toString();if(!append)grid.innerHTML='<div style="text-align:center;opacity:.7;padding:24px">Loading discussions...</div>';try{const res=await fetch(`/api/recommendations?${q}`);const data=await res.json();if(!res.ok)throw new Error(data.error||'Failed');if(!append)grid.innerHTML='';data.recommendations.forEach(rec=>grid.appendChild(renderCard(rec)));if(loadMore){if(data.hasMore){loadMore.style.display='inline-flex';loadMore.dataset.page=params.page||1;}else{loadMore.style.display='none';}}if(grid.children.length===0)grid.innerHTML='<div style="text-align:center;opacity:.7;padding:24px">No discussions yet</div>'; }catch(e){grid.innerHTML='<div style="text-align:center;color:#f87171;padding:24px">Failed to load discussions</div>';}}
function renderCard(rec){
  const el=document.createElement('article');
  const rid=rec._id||rec.id;
  const likeKey = `liked:${rid}`;
  const likedBefore = typeof localStorage!=='undefined' && localStorage.getItem(likeKey)==='1';
  el.className='discussion-card';
  el.innerHTML=`<div class="discussion-header"><div class="discussion-info"><h4>${esc(rec.title)}</h4><div class="discussion-meta"><span class="discussion-topic">${esc(rec.topic)}</span><span><i class="far fa-clock"></i> ${new Date(rec.createdAt).toLocaleString()}</span><span class="discussion-author"><i class="far fa-user"></i> ${esc(rec.name)}</span></div></div><button class="btn btn-secondary btn-like" data-id="${rid}" aria-pressed="${likedBefore?'true':'false'}" title="Like this discussion"><i class="far fa-thumbs-up"></i> ${rec.likes}</button></div><div class="discussion-content">${esc(rec.message)}</div><div class="discussion-footer"><div class="discussion-stats"><span class="discussion-stat"><i class="far fa-comment"></i> ${rec.replies} replies</span><span class="discussion-stat"><i class="far fa-thumbs-up"></i> ${rec.likes} likes</span></div><a href="#" class="read-more-discussion" data-id="${rid}">View Thread <i class="fas fa-arrow-right"></i></a></div>`;
  const likeBtn = el.querySelector('.btn-like');
  if(likedBefore){ likeBtn.classList.add('active'); }
  likeBtn.addEventListener('click',async e=>{
    const btn=e.currentTarget; const id=btn.getAttribute('data-id');
    if(typeof localStorage!=='undefined' && localStorage.getItem(likeKey)==='1'){ return; }
    // Optimistic UI
    const currentText = btn.textContent.trim();
    const current = parseInt(currentText.replace(/[^0-9]/g,''),10) || rec.likes || 0;
    const optimistic = current + 1;
    btn.disabled = true; btn.setAttribute('aria-busy','true');
    btn.innerHTML = `<i class="far fa-thumbs-up"></i> ${optimistic}`;
    try{
      const res=await fetch(`/api/recommendations/${id}/like`,{method:'POST'});
      const out=await res.json();
      if(!res.ok) throw new Error(out.error||'Failed');
      btn.innerHTML=`<i class=\"far fa-thumbs-up\"></i> ${out.likes}`;
      if(typeof localStorage!=='undefined'){ localStorage.setItem(likeKey,'1'); }
      btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
      // also update footer like stat text
      const likesStat = el.querySelector('.discussion-footer .discussion-stat i.far.fa-thumbs-up')?.parentElement;
      if(likesStat){ likesStat.innerHTML = `<i class=\"far fa-thumbs-up\"></i> ${out.likes} likes`; }
    }catch(err){
      // Rollback
      btn.innerHTML = `<i class=\"far fa-thumbs-up\"></i> ${current}`;
      alert('Failed to like');
    }finally{
      btn.disabled=false; btn.removeAttribute('aria-busy');
    }
  });
  return el;
}
function esc(s=''){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

// Thread modal and replies
document.addEventListener('click',async e=>{const link=e.target.closest('.read-more-discussion');if(!link)return;e.preventDefault();const id=link.getAttribute('data-id');openThread(id);});

async function openThread(id){const overlay=ensureThreadOverlay();overlay.querySelector('.thread-body').innerHTML='Loading...';overlay.style.display='flex';try{const res=await fetch(`/api/recommendations/${id}`);const rec=await res.json();if(!res.ok)throw new Error(rec.error||'Failed');renderThread(rec,overlay);}catch(err){overlay.querySelector('.thread-body').innerHTML='<div style="color:#f87171">Failed to load thread</div>';}}

function renderThread(rec,overlay){const body=overlay.querySelector('.thread-body');const header=overlay.querySelector('.thread-header');header.innerHTML=`<h3>${esc(rec.title)}</h3><span class="topic-pill">${esc(rec.topic)}</span>`;body.innerHTML=(rec.messages||[]).map(msg=>`<div class="chat-msg ${msg.role==='admin'?'admin':'user'}"><div class="chat-meta"><strong>${esc(msg.name||'')}</strong><span>${new Date(msg.createdAt||rec.createdAt).toLocaleString()}</span></div><div class="chat-bubble">${esc(msg.message)}</div></div>`).join('')||'<div>No messages yet</div>';const form=overlay.querySelector('form');form.onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());try{const res=await fetch(`/api/recommendations/${rec._id}/replies`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const out=await res.json();if(!res.ok)throw new Error(out.error||'Failed');openThread(rec._id);form.reset();}catch(err){alert('Failed to post reply');}}}

function ensureThreadOverlay(){let el=document.getElementById('thread-overlay');if(el)return el;el=document.createElement('div');el.id='thread-overlay';el.innerHTML=`<div class="thread-modal"><div class="thread-header"></div><div class="thread-body"></div><form class="thread-reply"><div class="reply-row"><input name="name" placeholder="Your name"><input name="email" type="email" placeholder="Your email"></div><textarea name="message" rows="3" placeholder="Write a reply..." required></textarea><details class="admin-tools"><summary>Admin tools</summary><input name="adminToken" placeholder="Admin token"></details><div class="reply-actions"><button type="submit" class="btn btn-primary"><i class="fas fa-paper-plane"></i> Reply</button><button type="button" class="btn btn-secondary btn-close-thread">Close</button></div></form></div>`;Object.assign(el.style,{position:'fixed',inset:'0',display:'none',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.5)',zIndex:2000});el.addEventListener('click',e=>{if(e.target===el)el.style.display='none';});el.querySelector('.btn-close-thread').addEventListener('click',()=>el.style.display='none');document.body.appendChild(el);return el;}
