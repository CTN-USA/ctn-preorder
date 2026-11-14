// Anonymous funnel tracking for the public CTN pages. Deploy with verify_jwt = false.
// Stores no personal data: a random per-browser session id, the event name, UTM/referrer and device class.
// Event names are allowlisted here. landing_events.event is unconstrained text, so this set is the gate.
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ok = () => new Response(null, { status: 204, headers: cors });
const EVENTS = new Set([
  "landing_view", "cta_click", "video_play", "video_50", "scroll_50", "scroll_90", "faq_open",
  "phone_click", "email_click", "preorder_view", "preorder_start", "preorder_submit",
  "press_view",
  "press_video_play", "press_video_50", "press_video_end", "press_video_download",
  "press_pdf_click", "press_zip_click", "press_interview_click", "press_email_click", "press_scroll_90",
  // Vertical landing pages (/sports, /studios, /clubs, /ledpro, /xcryo).
  "vertical_view", "vertical_lead_submit", "vertical_lead_ok", "vertical_lead_err",
  "order_click",
  // X°CRYO order form (/xcryo-order).
  "xcryo_order_view", "xcryo_order_start", "xcryo_order_submit",
  // Engagement on /xcryo and /xcryo-order. scroll_50 and email_click are already listed above.
  "scroll_25", "scroll_75", "scroll_100",
  "section_view",
  "tel_click", "outbound_click",
  "time_on_page",
]);
const s = (v: unknown, n = 120) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, n);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return ok();
  try {
    const b = JSON.parse((await req.text()).slice(0, 4000));
    const event = s(b.event, 40);
    const sid = s(b.sid, 64);
    if (!EVENTS.has(event) || !/^[a-z0-9-]{8,64}$/i.test(sid)) return ok();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const hourAgo = new Date(Date.now() - 3600_000).toISOString();
    const [{ count: mine }, { count: all }] = await Promise.all([
      admin.from("landing_events").select("id", { count: "exact", head: true }).eq("sid", sid).gte("ts", hourAgo),
      admin.from("landing_events").select("id", { count: "exact", head: true }).gte("ts", hourAgo),
    ]);
    if ((mine ?? 0) >= 120 || (all ?? 0) >= 20000) return ok();

    const ua = req.headers.get("user-agent") || "";
    const device = /bot|crawl|spider|preview|headless/i.test(ua) ? "bot" : /Mobi|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
    let extra: Record<string, unknown> = {};
    if (b.extra && typeof b.extra === "object") {
      const j = JSON.stringify(b.extra);
      if (j.length <= 500) extra = b.extra;
    }
    await admin.from("landing_events").insert({
      sid, event, device, extra,
      page: s(b.page, 60), variant: s(b.variant, 20),
      src: s(b.src, 60), medium: s(b.medium, 60), campaign: s(b.campaign, 80),
      referrer: s(b.referrer, 160),
    });
  } catch (_) { /* never surface errors to visitors */ }
  return ok();
});
