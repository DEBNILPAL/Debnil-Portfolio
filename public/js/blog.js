document.addEventListener('DOMContentLoaded',function(){loadBlogPosts({page:1});initFilters();initSearch();initNewsletter();});

function categoryIcon(category='', title=''){
  const c=(category||'').toLowerCase();
  const t=(title||'').toLowerCase();
  // Title-based hints first
  if(t.includes('css grid')||t.includes('grid')||t.includes('flexbox')) return 'fas fa-th-large';
  if(t.includes('responsive')) return 'fas fa-mobile-alt';
  if(c.includes('ai')||c.includes('ml')) return 'fas fa-robot';
  if(c.includes('security')||c.includes('cyber')) return 'fas fa-shield-alt';
  if(c.includes('react')) return 'fab fa-react';
  if(c.includes('node')) return 'fab fa-node-js';
  if(c.includes('javascript')||c==='js') return 'fab fa-js-square';
  if(c.includes('web')) return 'fas fa-globe';
  return 'fas fa-book-open';
}

async function loadBlogPosts(params={}){
  const grid=document.getElementById('blog-grid');
  const loadMore=document.getElementById('load-more-btn');
  if(!grid)return;
  const query=new URLSearchParams(params).toString();
  grid.innerHTML=params.page&&params.page>1?grid.innerHTML:'<div style="grid-column:1/-1;text-align:center;opacity:.7;padding:24px"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  try{
    const res=await fetch(`/api/blogs?${query}`);
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Failed');
    if(!(params.page&&params.page>1))grid.innerHTML='';
    data.posts.forEach(p=>{
      const el=document.createElement('article');
      el.className='blog-card';
      const iconClass = categoryIcon(p.category||'', p.title||'');
      el.innerHTML=`
        <div class="blog-image"><img src="${p.image}" alt="${p.title}"></div>
        <div class="blog-content">
          <div class="blog-icon"><i class="${iconClass}"></i></div>
          <div class="blog-meta">
            <span class="blog-date"><i class="fas fa-calendar"></i> ${new Date(p.publishDate).toLocaleDateString()}</span>
            <span class="blog-category">${p.category}</span>
          </div>
          <h3>${p.title}</h3>
          <p>${p.excerpt}</p>
          <a href="#" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
        </div>`;
      grid.appendChild(el);
    });
    if(loadMore){
      if(data.hasMore){
        loadMore.style.display='inline-flex';
        loadMore.dataset.page=(data.currentPage+1);
      }else{
        loadMore.style.display='none';
      }
    }
    if(grid.children.length===0){
      grid.innerHTML='<div style="grid-column:1/-1;text-align:center;opacity:.7;padding:24px">No posts found</div>';
    }
  }catch(e){
    grid.innerHTML='<div style="grid-column:1/-1;text-align:center;color:#f87171;padding:24px">Failed to load posts</div>';
  }
}
function initFilters(){const loadMore=document.getElementById('load-more-btn');if(loadMore){loadMore.addEventListener('click',()=>{const page=parseInt(loadMore.dataset.page||'2',10);const active=document.querySelector('.filter-btn.active');const category=active?active.getAttribute('data-filter'):'all';const search=document.getElementById('blog-search')?.value||'';loadBlogPosts({page,category,search});});}document.querySelectorAll('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const category=btn.getAttribute('data-filter');const search=document.getElementById('blog-search')?.value||'';loadBlogPosts({page:1,category,search});}));}
function initSearch(){const inp=document.getElementById('blog-search');if(!inp)return;let t;inp.addEventListener('input',e=>{clearTimeout(t);t=setTimeout(()=>{const search=e.target.value.trim();const category=document.querySelector('.filter-btn.active')?.getAttribute('data-filter')||'all';loadBlogPosts({page:1,category,search});},400);});}
function initNewsletter(){const form=document.getElementById('newsletter-form');if(!form)return;form.addEventListener('submit',async e=>{e.preventDefault();const email=form.querySelector('input[type="email"]').value.trim();if(!email.includes('@'))return alert('Enter a valid email');const btn=form.querySelector('button');const old=btn.innerHTML;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Subscribing...';btn.disabled=true;try{const res=await fetch('/api/blogs/newsletter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Failed');alert('Subscribed successfully!');form.reset();}catch(err){alert('Subscription failed');}finally{btn.innerHTML=old;btn.disabled=false;}});}
