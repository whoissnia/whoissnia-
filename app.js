import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, ADMIN_USERNAME, ADMIN_EMAIL } from "./config.js";

const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("COLLE_ICI") &&
  SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes("COLLE_ICI") &&
  ADMIN_EMAIL.includes("@") && !ADMIN_EMAIL.startsWith("REMPLACE");

const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = (id) => document.getElementById(id);
let links = [];
let toastTimer;

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2600);
}
function openModal() {
  $("admin-modal").classList.add("open");
  $("admin-modal").setAttribute("aria-hidden", "false");
}
function closeModal() {
  $("admin-modal").classList.remove("open");
  $("admin-modal").setAttribute("aria-hidden", "true");
}
$("admin-open").addEventListener("click", openModal);
$("admin-close").addEventListener("click", closeModal);
$("admin-modal").addEventListener("click", e => { if (e.target.dataset.close) closeModal(); });

function safeUrl(raw) {
  try { const u = new URL(raw); return ["https:", "http:"].includes(u.protocol) ? u.href : null; }
  catch { return null; }
}
function renderLinks() {
  const container = $("social-list");
  container.innerHTML = "";
  $("empty-note").hidden = links.length !== 0;
  if (!links.length) {
    container.innerHTML = '<div class="loading-card">Mes liens arrivent bientôt <span>♡</span></div>';
    return;
  }
  links.forEach(link => {
    const url = safeUrl(link.url);
    if (!url) return;
    const a = document.createElement("a");
    a.className = "social-card"; a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
    const icon = document.createElement("span"); icon.className = "social-icon"; icon.textContent = link.icon || "♡";
    const info = document.createElement("span");
    const name = document.createElement("span"); name.className = "social-name"; name.textContent = link.name;
    const handle = document.createElement("span"); handle.className = "social-handle"; handle.textContent = "tap to visit ✧";
    info.append(name, document.createElement("br"), handle);
    const arrow = document.createElement("span"); arrow.className = "social-arrow"; arrow.textContent = "↗";
    a.append(icon, info, arrow); container.append(a);
  });
}
function renderAdminLinks() {
  const container = $("admin-social-list"); container.innerHTML = "";
  links.forEach((link, index) => {
    const row = document.createElement("div"); row.className = "admin-social-item";
    const title = document.createElement("span"); title.className = "item-title"; title.textContent = `${link.icon || "♡"} ${link.name}`;
    const edit = document.createElement("button"); edit.className = "tiny-action"; edit.textContent = "EDIT";
    edit.addEventListener("click", () => {
      $("social-id").value = link.id; $("social-name").value = link.name;
      $("social-url").value = link.url; $("social-icon").value = link.icon || "";
      $("social-submit").textContent = "SAVE CHANGES"; $("social-cancel").hidden = false;
    });
    const up = document.createElement("button"); up.className = "tiny-action"; up.textContent = "↑"; up.title = "Monter";
    up.disabled = index === 0; up.addEventListener("click", () => moveLink(index, -1));
    const down = document.createElement("button"); down.className = "tiny-action"; down.textContent = "↓"; down.title = "Descendre";
    down.disabled = index === links.length - 1; down.addEventListener("click", () => moveLink(index, 1));
    const del = document.createElement("button"); del.className = "tiny-action delete"; del.textContent = "×";
    del.addEventListener("click", () => deleteLink(link.id));
    row.append(title, up, down, edit, del); container.append(row);
  });
}
async function loadPublic() {
  if (!supabase) {
    links = [];
    $("social-list").innerHTML = '<div class="loading-card">Configure Supabase pour afficher tes liens ♡</div>';
    return;
  }
  const [{ data: linkData, error: linkError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("social_links").select("*").eq("is_visible", true).order("position", { ascending: true }),
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle()
  ]);
  if (linkError || settingsError) { $("social-list").innerHTML = '<div class="loading-card">Impossible de charger les liens pour le moment.</div>'; return; }
  links = linkData || []; renderLinks();
  if (settings) applySettings(settings);
}
function applySettings(s) {
  $("display-name").textContent = s.display_name || "whoissnia";
  const heart = document.createElement("span"); heart.className = "pink-heart"; heart.textContent = "♡"; $("display-name").append(heart);
  $("display-bio").textContent = s.bio || "a little corner of my internet universe";
  if (s.avatar_url && safeUrl(s.avatar_url)) {
    $("avatar").style.backgroundImage = `url("${safeUrl(s.avatar_url)}")`;
    $("avatar").textContent = "";
  } else { $("avatar").style.backgroundImage = ""; $("avatar").textContent = (s.display_name || "w.").slice(0,2); }
}
async function refreshAdmin() {
  const { data, error } = await supabase.from("social_links").select("*").order("position", { ascending: true });
  if (error) throw error;
  links = data || []; renderLinks(); renderAdminLinks();
  const { data: settings } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (settings) {
    $("setting-name").value = settings.display_name || "whoissnia";
    $("setting-bio").value = settings.bio || "";
    $("setting-avatar").value = settings.avatar_url || "";
    applySettings(settings);
  }
}
$("login-form").addEventListener("submit", async e => {
  e.preventDefault(); $("login-error").textContent = "";
  if (!supabase) { $("login-error").textContent = "Configuration manquante : complète config.js puis recharge la page."; return; }
  const username = $("username").value.trim();
  if (username !== ADMIN_USERNAME) { $("login-error").textContent = "Identifiant incorrect."; return; }
  const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: $("password").value });
  if (error) { $("login-error").textContent = "Connexion impossible. Vérifie tes identifiants."; return; }
  $("login-view").hidden = true; $("dashboard-view").hidden = false;
  try { await refreshAdmin(); } catch { $("admin-message").textContent = "Erreur de chargement du tableau de bord."; }
});
$("logout-button").addEventListener("click", async () => {
  await supabase.auth.signOut(); $("dashboard-view").hidden = true; $("login-view").hidden = false;
  $("password").value = ""; $("login-error").textContent = ""; toast("Déconnectée ♡");
});
$("settings-form").addEventListener("submit", async e => {
  e.preventDefault();
  const payload = { id: 1, display_name: $("setting-name").value.trim() || "whoissnia", bio: $("setting-bio").value.trim(), avatar_url: $("setting-avatar").value.trim() || null, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("site_settings").upsert(payload);
  if (error) { toast("Enregistrement impossible"); return; }
  applySettings(payload); toast("Profil mis à jour ♡");
});
$("social-form").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("social-name").value.trim(), url = safeUrl($("social-url").value.trim());
  if (!url) { toast("Ajoute un lien http ou https valide"); return; }
  const id = $("social-id").value;
  const payload = { name, url, icon: $("social-icon").value.trim() || "♡" };
  let result;
  if (id) result = await supabase.from("social_links").update(payload).eq("id", id);
  else result = await supabase.from("social_links").insert({ ...payload, position: links.length, is_visible: true });
  if (result.error) { toast("Impossible d'enregistrer ce lien"); return; }
  resetSocialForm(); await refreshAdmin(); toast(id ? "Lien modifié ♡" : "Lien ajouté ♡");
});
function resetSocialForm() {
  $("social-form").reset(); $("social-id").value = ""; $("social-submit").textContent = "ADD LINK +"; $("social-cancel").hidden = true;
}
$("social-cancel").addEventListener("click", resetSocialForm);
async function deleteLink(id) {
  if (!confirm("Supprimer ce réseau ?")) return;
  const { error } = await supabase.from("social_links").delete().eq("id", id);
  if (error) { toast("Suppression impossible"); return; }
  await refreshAdmin(); toast("Lien supprimé");
}
async function moveLink(index, delta) {
  const next = index + delta; if (next < 0 || next >= links.length) return;
  const reordered = [...links]; [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
  const updates = reordered.map((item, i) => supabase.from("social_links").update({ position: i }).eq("id", item.id));
  const results = await Promise.all(updates);
  if (results.some(r => r.error)) { toast("Réorganisation impossible"); return; }
  await refreshAdmin();
}
if (configured) {
  supabase.auth.getSession().then(async ({ data }) => {
    if (data.session) {
      openModal(); $("login-view").hidden = true; $("dashboard-view").hidden = false;
      try { await refreshAdmin(); } catch {}
    }
  });
}
loadPublic();
