const SUPA_URL = 'https://znezjmhkzdhlxdigajbo.supabase.co';
const SUPA_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuZXpqbWhremRobHhkaWdhamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NzczMDAsImV4cCI6MjA5NjI1MzMwMH0.BQxJAvsF_8Qj1s4N8wlXuaPt_omCleWhnuWIR22sGcc';

let _supabase = null;

function getSupabase() {
  if (!_supabase) {
    _supabase = supabase.createClient(SUPA_URL, SUPA_ANON_KEY);
  }
  return _supabase;
}

async function getSession() {
  const { data } = await getSupabase().auth.getSession();
  return data.session;
}

async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

async function requireAuth(redirectTo = '/login') {
  const user = await getUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

async function signOut() {
  await getSupabase().auth.signOut();
  window.location.href = '/login';
}

async function getUserId() {
  const user = await getUser();
  return user?.id ?? null;
}

async function getAccessToken() {
  const session = await getSession();
  return session?.access_token ?? null;
}
