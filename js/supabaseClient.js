/* supabaseClient.js */

// Project URL y publishable key (Project Settings → API, en el panel de Supabase)
const SUPABASE_URL      = "https://tdgrelqkebqqattxzmar.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_htbsUIixcLTyqA_0NrASyQ_wZKKun5b";

// El script del CDN crea una variable global "supabase" que trae
// la función createClient(). La usamos para crear NUESTRO propio
// cliente, y lo guardamos en una variable con otro nombre (db) para
// no confundirla con el objeto global de la librería.
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
