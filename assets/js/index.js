
const HOME_PAGE_SIZE = 12;
let homeProducts = [];
let visibleCount = HOME_PAGE_SIZE;
let currentCategory = '';
let currentQuery = '';
function buildStars(value){ const rounded=Math.round(Number(value)||0); return `<span class="stars">${Array.from({length:5},(_,i)=>`<span class="star ${i<rounded?'filled':''}">★</span>`).join('')}</span>`; }
function renderProductCard(product, favoriteIds=new Set()){
  const fav = favoriteIds.has(product.id);
  return `<article class="product-card featured-card"><a class="product-image-link" href="./product.html?slug=${encodeURIComponent(product.slug)}"><img class="product-thumb" loading="lazy" src="${product.image_url||'./assets/img/placeholders/product-placeholder.png'}" alt="${product.name}"><button class="floating-cart" onclick="event.preventDefault();event.stopPropagation();handleFeaturedAddToCart('${product.id}')" aria-label="Səbətə at">🛒</button></a><div class="product-body"><div class="product-head-row"><h3 class="product-title clamp-2">${product.name}</h3><span class="unit-badge">${product.unit||'ədəd'}</span></div><div class="price-stack"><strong class="product-price">${Number(product.price).toFixed(2)} ₼</strong>${product.old_price?`<span class="product-old-price">${Number(product.old_price).toFixed(2)} ₼</span>`:''}</div><div class="rating-row">${buildStars(product.rating_avg || 0)}<span>${Number(product.rating_avg||0).toFixed(1)}</span></div><p class="product-desc clamp-2">${product.short_description || product.description || 'Təzə və keyfiyyətli məhsul.'}</p><button class="fav-toggle ${fav?'active':''}" onclick="event.preventDefault();event.stopPropagation();toggleFeaturedFavorite('${product.id}', this)">♥</button></div></article>`;
}
async function handleFeaturedAddToCart(productId){ try{ const {error}=await UserAPI.addToCart(productId,1); if(error) return showToast(error.message||'Səbətə əlavə olunmadı','error'); showToast('Məhsul səbətə əlavə olundu','success'); }catch(err){ showToast(err.message,'error'); } }
async function toggleFeaturedFavorite(productId,btn){ try{ const {error,action}=await UserAPI.toggleFavorite(productId); if(error) return showToast(error.message||'Əməliyyat alınmadı','error'); btn.classList.toggle('active', action==='added'); showToast(action==='added'?'Sevimlilərə əlavə olundu':'Sevimlilərdən çıxarıldı','success'); }catch(err){ showToast(err.message,'error'); } }
function getFilteredProducts(){
  return homeProducts.filter(item => (!currentCategory || item.categories?.slug === currentCategory) && (!currentQuery || [item.name,item.short_description,item.description].filter(Boolean).join(' ').toLowerCase().includes(currentQuery.toLowerCase())));
}
async function renderHomeProducts(){
  const box=document.getElementById('featuredProducts'); if(!box) return;
  const { data:favIds } = await UserAPI.getFavoriteIds(); const favSet=new Set(favIds||[]);
  const items=getFilteredProducts();
  box.innerHTML = items.length ? items.slice(0,visibleCount).map(item=>renderProductCard(item,favSet)).join('') : '<div class="card">Məhsul tapılmadı.</div>';
  const loadMoreBtn=document.getElementById('loadMoreHomeProducts');
  if(loadMoreBtn) loadMoreBtn.style.display = items.length > visibleCount ? 'inline-flex' : 'none';
}
function renderCategoryChips(categories){
  const box=document.getElementById('homeCategoryChips'); if(!box) return;
  box.innerHTML = [`<button class="filter-chip ${currentCategory===''?'active':''}" data-slug="">Hamısı</button>`, ...(categories||[]).slice(0,12).map(cat=>`<button class="filter-chip ${currentCategory===cat.slug?'active':''}" data-slug="${cat.slug}">${cat.name}</button>`)].join('');
  box.querySelectorAll('.filter-chip').forEach(btn=>btn.addEventListener('click', ()=>{ currentCategory = btn.dataset.slug || ''; visibleCount = HOME_PAGE_SIZE; renderCategoryChips(categories); renderHomeProducts(); }));
}
async function renderSideContent(){
  const [bannersRes,newsRes] = await Promise.all([
    supabaseClient.from('banners').select('*').eq('is_active', true).order('sort_order',{ascending:true}).limit(4),
    supabaseClient.from('news').select('*').eq('is_active', true).order('created_at',{ascending:false}).limit(3)
  ]);
  const bannerBox=document.getElementById('homeBanners');
  const newsBox=document.getElementById('homeNews');
  if(bannerBox) bannerBox.innerHTML=(bannersRes.data||[]).length ? (bannersRes.data||[]).map(item=>`<article class="banner-item">${item.image_url?`<img src="${item.image_url}" loading="lazy" alt="${item.title||'Banner'}">`:''}<strong>${item.title||'Banner'}</strong>${item.link_url?`<p><a href="${item.link_url}">Ətraflı bax</a></p>`:''}</article>`).join('') : '<p class="muted">Banner yoxdur.</p>';
  if(newsBox) newsBox.innerHTML=(newsRes.data||[]).length ? (newsRes.data||[]).map(item=>`<article class="news-item">${item.image_url?`<img src="${item.image_url}" loading="lazy" alt="${item.title}">`:''}<strong>${item.title}</strong><p>${item.excerpt||''}</p></article>`).join('') : '<p class="muted">Xəbər yoxdur.</p>';
}
(async function initHome(){
  const search=document.getElementById('homeSearchInput');
  const clearBtn=document.getElementById('clearHomeFilters');
  const loadMoreBtn=document.getElementById('loadMoreHomeProducts');
  if(search) search.addEventListener('input', ()=>{ currentQuery=search.value.trim(); visibleCount=HOME_PAGE_SIZE; renderHomeProducts(); });
  clearBtn?.addEventListener('click', ()=>{ currentCategory=''; currentQuery=''; visibleCount=HOME_PAGE_SIZE; if(search) search.value=''; renderCategoryChips(window.__homeCategories||[]); renderHomeProducts(); });
  loadMoreBtn?.addEventListener('click', ()=>{ visibleCount += HOME_PAGE_SIZE; renderHomeProducts(); });
  document.getElementById('featuredProducts').innerHTML='<div class="card">Məhsullar yüklənir...</div>';
  const [productsRes,categoriesRes] = await Promise.all([UserAPI.getProducts({pageSize:24}), UserAPI.getCategories()]);
  if(productsRes.error){ document.getElementById('featuredProducts').innerHTML=`<div class="card">Xəta: ${productsRes.error.message}</div>`; return; }
  homeProducts = productsRes.data || [];
  window.__homeCategories = categoriesRes.data || [];
  renderCategoryChips(window.__homeCategories);
  await renderHomeProducts();
  await renderSideContent();
})();
