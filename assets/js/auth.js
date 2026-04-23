const AuthService = {
  async signUp({ firstName, lastName, email, phone, password }) {
    return await supabaseClient.auth.signUp({
      email,password,
      options:{
        emailRedirectTo:`${window.location.origin}${window.location.pathname.includes('/admin/')||window.location.pathname.includes('/courier/')?'../':''}/auth-callback.html`,
        data:{first_name:firstName||'',last_name:lastName||'',phone:phone||''}
      }
    });
  },
  async signIn({ email, password }) { return await supabaseClient.auth.signInWithPassword({ email, password }); },
  async signOut(){ return await supabaseClient.auth.signOut(); },
  async forgotPassword(email){ return await supabaseClient.auth.resetPasswordForEmail(email,{ redirectTo:`${window.location.origin}/reset-password.html`}); },
  async updatePassword(newPassword){ return await supabaseClient.auth.updateUser({ password:newPassword }); },
  async signInWithGoogle(){ return await supabaseClient.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:`${window.location.origin}/auth-callback.html` } }); },
  async signInWithApple(){ return await supabaseClient.auth.signInWithOAuth({ provider:'apple', options:{ redirectTo:`${window.location.origin}/auth-callback.html` } }); },
  async sendOtp(email){ return await supabaseClient.auth.signInWithOtp({ email, options:{ emailRedirectTo:`${window.location.origin}/auth-callback.html` } }); },
  async getSession(){ return await getCachedSession(); },
  async getUser(){ return await getCachedUser(); },
  async getMyProfile(){
    const user=(await getCachedUser()).data.user;
    if(!user) return {data:null,error:new Error('İstifadəçi tapılmadı')};
    return await supabaseClient.from('profiles').select('id,email,first_name,last_name,phone,bio,avatar_url,role,is_active,created_at').eq('id', user.id).single();
  },
  async updateMyProfile(payload){
    const user=(await getCachedUser()).data.user;
    if(!user) return {data:null,error:new Error('İstifadəçi tapılmadı')};
    return await supabaseClient.from('profiles').update(payload).eq('id', user.id).select().single();
  },
  async getMyRole(){ return await supabaseClient.rpc('get_my_role'); }
};

supabaseClient.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
    const roleResult = await AuthService.getMyRole();
    const role = roleResult?.data || 'user';
    if (window.location.pathname.includes('/admin/') && role !== 'admin') window.location.href = '../login.html';
    if (window.location.pathname.includes('/courier/') && role !== 'courier') window.location.href = '../login.html';
  }
});
