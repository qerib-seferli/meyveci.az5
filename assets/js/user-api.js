const UserAPI = {
  async getCurrentUser(){ const { data } = await getCachedUser(); return data.user || null; },
  async getCategories() { return await supabaseClient.from('categories').select('id,name,slug,image_url,sort_order,is_active,description').eq('is_active', true).order('sort_order', { ascending: true }).order('name', { ascending: true }); },
  async getProducts({ categorySlug = '', q = '', featured = false, discounted = false, priceMin = '', priceMax = '', page = 1, pageSize = 24 } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(60, Math.max(1, Number(pageSize) || 24));
    let query = supabaseClient
      .from('products')
      .select(`id,category_id,name,slug,price,old_price,stock_quantity,unit,image_url,short_description,description,rating_avg,is_featured,status,created_at,categories:category_id (id,name,slug)`, { count: 'exact' })
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (featured) query = query.eq('is_featured', true);
    if (discounted) query = query.not('old_price', 'is', null);
    if (priceMin !== '' && !Number.isNaN(Number(priceMin))) query = query.gte('price', Number(priceMin));
    if (priceMax !== '' && !Number.isNaN(Number(priceMax))) query = query.lte('price', Number(priceMax));
    if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,description.ilike.%${q}%`);

    const from = (safePage - 1) * safePageSize;
    const to = from + safePageSize - 1;
    const { data, error, count } = await query.range(from, to);
    if (error) return { data: null, error };

    let result = data || [];
    if (categorySlug) result = result.filter(item => item.categories?.slug === categorySlug);

    return { data: result, total: count || result.length, error: null };
  },
  async getProductBySlug(slug) { return await supabaseClient.from('products').select(`*, categories:category_id (id,name,slug)`).eq('slug', slug).single(); },
  async getRelatedProducts(product){ if(!product) return {data:[], error:null}; const {data,error}=await this.getProducts({ categorySlug: product.categories?.slug || '', pageSize: 8 }); if(error) return {data:null,error}; return { data:(data||[]).filter(item=>item.id!==product.id).slice(0,4), error:null }; },
  async getFavorites() { const user = await this.getCurrentUser(); if(!user) return { data: [], error: null }; return await supabaseClient.from('favorites').select(`id, product_id, products:product_id (*)`).eq('user_id', user.id).order('created_at', { ascending: false }); },
  async getFavoriteIds() { const user = await this.getCurrentUser(); if(!user) return { data: [], error: null }; const { data, error } = await supabaseClient.from('favorites').select('product_id').eq('user_id', user.id); if (error) return { data: [], error }; return { data: (data || []).map(item => item.product_id), error: null }; },
  async toggleFavorite(productId) { const user = await this.getCurrentUser(); if (!user) throw new Error('Əvvəlcə daxil ol'); const { data: existing } = await supabaseClient.from('favorites').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle(); if (existing?.id) { const res = await supabaseClient.from('favorites').delete().eq('id', existing.id); return { ...res, action:'removed' }; } const res = await supabaseClient.from('favorites').insert({ user_id: user.id, product_id: productId }); return { ...res, action:'added' }; },
  async getCart() { const user = await this.getCurrentUser(); if(!user) return { data: [], error: null }; return await supabaseClient.from('cart_items').select(`*, products:product_id (*)`).eq('user_id', user.id).order('created_at', { ascending: false }); },
  async addToCart(productId, quantity = 1) { const user = await this.getCurrentUser(); if(!user) throw new Error('Əvvəlcə daxil ol'); const { data: existing } = await supabaseClient.from('cart_items').select('id, quantity').eq('user_id', user.id).eq('product_id', productId).maybeSingle(); if(existing?.id) return await supabaseClient.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id); return await supabaseClient.from('cart_items').insert({ user_id:user.id, product_id:productId, quantity }); },
  async updateCartItem(itemId, quantity) { if(quantity<=0) return await supabaseClient.from('cart_items').delete().eq('id',itemId); return await supabaseClient.from('cart_items').update({quantity}).eq('id',itemId); },
  async removeCartItem(itemId) { return await supabaseClient.from('cart_items').delete().eq('id', itemId); },
  async getAddresses() { const user = await this.getCurrentUser(); if(!user) return {data:[], error:null}; return await supabaseClient.from('addresses').select('*').eq('user_id', user.id).order('is_default',{ascending:false}).order('created_at',{ascending:false}); },
  async addAddress(payload){ const user=await this.getCurrentUser(); if(!user) throw new Error('Əvvəlcə daxil ol'); return await supabaseClient.from('addresses').insert({ user_id:user.id, ...payload }); },
  async updateAddress(id,payload){ return await supabaseClient.from('addresses').update(payload).eq('id',id); },
  async deleteAddress(id){ return await supabaseClient.from('addresses').delete().eq('id',id); },
  async createOrderFromCart({ addressId, paymentMethod='manual', note='' }){ return await supabaseClient.rpc('create_order_from_cart',{ p_address_id:addressId, p_payment_method:paymentMethod, p_customer_note:note }); },
  async getOrders(){ const user = await this.getCurrentUser(); if(!user) return {data:[], error:null}; return await supabaseClient.from('orders').select('*').eq('user_id', user.id).order('created_at',{ascending:false}); },
  async getOrderById(orderId){ return await supabaseClient.from('orders').select(`*, addresses:address_id (*), order_items (*)`).eq('id',orderId).single(); }
};
