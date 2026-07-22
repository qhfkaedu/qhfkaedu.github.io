// 방명록 — Supabase에 글을 저장하고 읽어옵니다.
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/* ─────────────────────────────────────────
   ✏️ 본인 프로젝트 값으로 바꾸세요.
   Supabase → Project Settings → API Keys

   이 두 값은 공개해도 됩니다. 브라우저에 그대로 내려갑니다.
   ❌ Secret key(sb_secret_…)는 절대 여기 넣지 마세요.
   ───────────────────────────────────────── */
const SUPABASE_URL = "https://unwilqnyupyxhejvooio.supabase.co";
const SUPABASE_KEY = "sb_publishable_hAK-cIjLp-B__ub76CJ4Bg_6ZzVVz8g";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const el = (id) => document.getElementById(id);
const form = el("gb-form");


/* ── 목록 읽기 ────────────────────────────── */

async function load() {
  const { data, error } = await db
    .from("guestbook")
    .select("name, message, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return say(explain(error), "bad");

  if (!data.length) {
    el("gb-list").innerHTML = "";
    return say("아직 아무도 남기지 않았습니다. 첫 번째가 되어보세요.");
  }

  hide();
  el("gb-list").innerHTML = data.map((row) => `
    <li class="gb-item">
      <p class="gb-meta"><b>${esc(row.name)}</b><span>${when(row.created_at)}</span></p>
      <p class="gb-msg">${esc(row.message)}</p>
    </li>
  `).join("");
}


/* ── 글 남기기 ────────────────────────────── */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = el("gb-name").value.trim();
  const message = el("gb-message").value.trim();
  if (!name || !message) return;

  el("gb-submit").disabled = true;
  say("남기는 중…");

  const { error } = await db.from("guestbook").insert({ name, message });

  el("gb-submit").disabled = false;

  if (error) return say(explain(error), "bad");

  el("gb-message").value = "";
  count();
  say("남겼습니다. 고마워요!", "ok");

  // 성공 메시지를 잠깐 보여준 뒤 목록을 새로 그립니다.
  setTimeout(load, 1200);
});


/* ── 글자 수 ──────────────────────────────── */

function count() {
  el("gb-count").textContent = `${el("gb-message").value.length} / 200`;
}

el("gb-message").addEventListener("input", count);


/* ── 거들기 ───────────────────────────────── */

// Supabase가 주는 메시지는 초보자에게 불친절합니다. 바꿔서 보여줍니다.
function explain(error) {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "권한이 없습니다. 테이블의 RLS 정책을 확인하세요.";
  }
  if (error.code === "42P01") {
    return "guestbook 테이블이 없습니다. SQL Editor에서 테이블을 먼저 만드세요.";
  }
  if (/Failed to fetch|NetworkError/i.test(error.message)) {
    return "Supabase에 연결하지 못했습니다. 주소가 맞는지, 프로젝트가 멈춰 있지는 않은지 확인하세요.";
  }
  return error.message;
}

function say(text, kind = "") {
  const s = el("gb-status");
  s.textContent = text;
  s.hidden = false;
  s.className = `gb-status ${kind}`;
}

function hide() {
  el("gb-status").hidden = true;
}

// 남이 쓴 글이 HTML로 해석되지 않게 막습니다.
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function when(iso) {
  const sec = (Date.now() - new Date(iso)) / 1000;
  if (sec < 60) return "방금";
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}


count();
load();
