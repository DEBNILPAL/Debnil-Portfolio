document.addEventListener('DOMContentLoaded',function(){loadBlogPosts({page:1});initFilters();initSearch();initNewsletter();initArticleView();});

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
function initArticleView(){
  const gridSection=document.querySelector('.blog-grid-section');
  const featuredSection=document.querySelector('.featured-post');
  const hero=document.querySelector('.blog-hero');
  const filters=document.querySelector('.blog-filters');
  const navbar=document.querySelector('.navbar');
  const footer=document.querySelector('footer');
  const detail=document.getElementById('article-detail');
  const back=document.getElementById('article-back');
  const getParams=()=>new URLSearchParams(location.search);
  const setParams=(obj)=>{
    const sp=new URLSearchParams(location.search);
    Object.entries(obj||{}).forEach(([k,v])=>{
      if(v===null||v===undefined||v===''){ sp.delete(k); } else { sp.set(k,v); }
    });
    const q=sp.toString();
    const url = q? `${location.pathname}?${q}`: location.pathname;
    history.replaceState({}, '', url);
  };
  const setVisible=(showDetail)=>{
    detail.style.display=showDetail? 'block':'none';
    if(hero) hero.style.display=showDetail? 'none':'';
    if(filters) filters.style.display=showDetail? 'none':'';
    if(featuredSection) featuredSection.style.display=showDetail? 'none':'';
    if(gridSection) gridSection.style.display=showDetail? 'none':'';
    if(navbar) navbar.style.display=showDetail? 'none':'';
    if(footer) footer.style.display=showDetail? 'none':'';
    window.scrollTo({top:0,behavior:'smooth'});
  };
  async function showArticleDetail({slug,title,image,category,date}, {updateUrl}={updateUrl:true}){
    const t=decodeURIComponent(title||'');
    const img=decodeURIComponent(image||'');
    const cat=decodeURIComponent(category||'');
    const dt=decodeURIComponent(date||'');
    const s=decodeURIComponent(slug||'');
    const titleEl=document.getElementById('article-title');
    const imgEl=document.getElementById('article-image');
    const catEl=document.getElementById('article-category');
    const dateEl=document.getElementById('article-date');
    const bodyEl=document.getElementById('article-body');
    // Pre-fill basic fields before fetch for fast UI
    if(titleEl) titleEl.textContent=t||'Article Title';
    if(imgEl) imgEl.src=img||'assets/featured-blog.svg';
    if(catEl) catEl.textContent=cat||'Blog';
    if(dateEl) dateEl.innerHTML = `<i class="fas fa-calendar"></i> ${dt? new Date(dt).toLocaleDateString(): ''}`;
    if(bodyEl) bodyEl.innerHTML='<p>Loading article...</p>';
    setVisible(true);
    if(updateUrl){
      // Persist selection in URL so refresh keeps the article open
      setParams({
        view:'article',
        slug: encodeURIComponent(s||''),
        title: encodeURIComponent(t),
        image: encodeURIComponent(img||'assets/featured-blog.svg'),
        category: encodeURIComponent(cat||'Blog'),
        date: encodeURIComponent(dt||new Date().toISOString())
      });
    }
    // Load full article content if slug available
    if(s){
      try{
        const res = await fetch(`/api/blogs/${s}`);
        const post = await res.json();
        if(res.ok && post){
          if(titleEl) titleEl.textContent = post.title || t;
          if(imgEl) imgEl.src = post.image || img || 'assets/featured-blog.svg';
          if(catEl) catEl.textContent = post.category || cat || 'Blog';
          if(dateEl) dateEl.innerHTML = `<i class=\"fas fa-calendar\"></i> ${post.publishDate? new Date(post.publishDate).toLocaleDateString(): (dt? new Date(dt).toLocaleDateString(): '')}`;
          if(bodyEl) bodyEl.innerHTML = (post.content||'').replace(/\n/g,'<br>') || '<p>No content available.</p>';
        }else{
          if(bodyEl) bodyEl.innerHTML = '<p>Failed to load article.</p>';
        }
      }catch(e){ if(bodyEl) bodyEl.innerHTML = '<p>Failed to load article.</p>'; }
    }else{
      if(bodyEl) bodyEl.innerHTML = '<p>No article selected.</p>';
    }
  }
  // Delegate clicks inside blog grid
  const grid=document.getElementById('blog-grid');
  if(grid){
    grid.addEventListener('click',(e)=>{
      const a=e.target.closest('a.read-more');
      if(!a) return;
      e.preventDefault();
      const data={slug:a.dataset.slug,title:a.dataset.title,image:a.dataset.image,category:a.dataset.category,date:a.dataset.date};
      showArticleDetail(data);
    });
  }
  // Featured "Read Full Article" button
  const featuredBtn=document.querySelector('.featured-article .read-more-btn');
  if(featuredBtn){
    featuredBtn.addEventListener('click',async (e)=>{
      e.preventDefault();
      try{
        const res = await fetch('/api/blogs/featured');
        const post = await res.json();
        if(!res.ok) throw new Error('Failed');
        showArticleDetail({
          slug: encodeURIComponent(post.slug||''),
          title: encodeURIComponent(post.title||''),
          image: encodeURIComponent(post.image||'assets/featured-blog.svg'),
          category: encodeURIComponent(post.category||'Blog'),
          date: encodeURIComponent(post.publishDate||'')
        });
      }catch(err){
        alert('Failed to load featured article');
      }
    });
  }
  if(back){
    back.addEventListener('click',()=>{ setVisible(false); setParams({view:null,title:null,image:null,category:null,date:null}); });
  }

  // Restore article view from URL on load/refresh
  const sp=getParams();
  if((sp.get('view')||'')==='article'){
    const payload={
      slug: sp.get('slug')||'',
      title: sp.get('title')||'',
      image: sp.get('image')||'',
      category: sp.get('category')||'',
      date: sp.get('date')||''
    };
    showArticleDetail(payload, {updateUrl:false});
  }
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
          <a href="#" class="read-more" 
             data-slug="${encodeURIComponent(p.slug)}"
             data-title="${encodeURIComponent(p.title)}"
             data-image="${encodeURIComponent(p.image)}"
             data-category="${encodeURIComponent(p.category)}"
             data-date="${encodeURIComponent(p.publishDate)}"
          >Read More <i class="fas fa-arrow-right"></i></a>
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
