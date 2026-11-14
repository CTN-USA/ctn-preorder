# CTN-USA OxyPro pre-order pages

Static pages, no build step. Import into Vercel as-is.

- `index.html` — main OxyPro lander
- `preorder.html` — public pre-order form (served at `/preorder`)
- `preorder-accept.html` — quote accept page linked from the emailed quote (served at `/preorder-accept`)
- `xcryo.html` — X°CRYO lander (`/xcryo`, and the root of `xcryo.ctn-usa.com`) with a request-info form into `preorder-intake` (`vertical=xcryo`)
- `xcryo-order.html` — X°CRYO order form (`/xcryo-order`): cash/wire or lease through Brickhouse, posts a full order to `preorder-intake` with `product=xcryo`
- `sports.html` / `studios.html` / `clubs.html` — LinkedIn Ads vertical landers (`/sports`, `/studios`, `/clubs`) with wellbeing + dollar ROI and soft-lead form into `preorder-intake` (`lead_type=linkedin_vertical_lead`)

`vercel.json` sets `cleanUrls: true`, so those HTML files are served at `/sports`, `/studios`, and `/clubs` the same way `/preorder` serves `preorder.html`.

LinkedIn Insight Tag partner ID: `11243561` (vertical landers, the main lander, and the pre-order form).

Soft leads post to the existing Supabase `preorder-intake` function with `vertical`, `interest` (VH1/VH2), `beyond_activ_meeting`, and `utm_source` / `utm_medium` / `utm_campaign` / `utm_content` from the URL. Full pre-orders are unchanged.

X°CRYO: both forms create a quote in the quote tool and email it to the visitor; sales@ctn-usa.com gets a copy of every field submitted. Submissions marked `TEST - CTN Marketing` (or opened with `?test=1`) send the sales copy to the quote owner only.
