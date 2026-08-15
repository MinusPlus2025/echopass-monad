# EchoPass — MOJO Submission Draft

## Tagline

**Hear the moment. Prove you were there.**

中文：**听见现场，领取凭证。**

## Short description

EchoPass is a sound-native proof-of-presence protocol on Monad. Event hosts broadcast a rotating six-digit audible challenge; nearby attendees capture it in a mobile browser, bind a short-lived voucher to their wallet, and claim a one-time onchain credential. Anyone can verify the result, and the same wallet cannot replay the claim.

## 中文项目介绍

线下活动通常依赖固定二维码签到：图片容易被转发，签到记录被平台锁在中心化后台，奖励发放又慢又难核验。EchoPass 把“现场正在发生的声音”变成短时挑战。主办方播放每 30 秒轮换的六位声音码，参与者通过手机浏览器听取或输入识别结果，获得与钱包绑定、90 秒内有效的签名凭证，并在 Monad 上领取不可重复的参与证明和可选奖励。

EchoPass 不声称声音能够绝对证明地理位置；它证明的是某个钱包在极短时间窗口内取得了活动方签发的现场挑战。通过短时效、钱包绑定、链上防重复和公开验证，它显著提高固定二维码被静态转发和批量领取的成本，同时保持无需安装 App 的低门槛体验。

## What is new

- Sound is the event interface, not a decorative effect or QR replacement skin.
- A rotating acoustic challenge is converted into a wallet-bound, expiring authorization.
- Monad turns the claim into a visibly fast shared state transition: attendee confirmation and public verifier update belong to one continuous demo.
- The protocol is honest about its trust boundary: practical anti-sharing friction, not impossible “absolute location proof.”

## Why Monad

- Fast blocks and finality keep “hear → claim → verify” interactive in a live venue.
- Low transaction costs make small event rewards and high attendee volumes viable.
- EVM compatibility lets organizers integrate wallet and event tooling without a proprietary database.
- Public, deterministic replay prevention is the core product behavior, not an afterthought.

## Real demand

Initial users are hackathons, meetups, workshops, music venues, brand activations, conferences, and university events that already spend money or staff time on check-in, attendance rewards, sponsor quests, and post-event community segmentation.

The wedge is not “replace every ticket.” It is a lightweight participation layer for moments where organizers want to know that a wallet received a live challenge and to reward that action transparently.

## Commercial model

1. Free tier for small public events and community adoption.
2. Organizer SaaS fee per event for custom branding, analytics, exports, and campaign controls.
3. Usage fee per verified claim or reward distribution for large events.
4. Enterprise integrations for ticketing, loyalty, sponsor campaigns, and CRM/community tools.

Core buyer value: less manual check-in, lower static-code sharing, auditable sponsor rewards, and a reusable onchain audience graph controlled by attendee wallets.

## Five-minute demo

### 0:00–0:35 — Problem

“Fixed QR codes are easy to forward, and platform attendance records are not portable. EchoPass turns a live sound into a short-lived wallet authorization.”

### 0:35–1:20 — Host

- Open Host view.
- Show event name, six-digit code, and 30-second countdown.
- Press **Play sound** and explain that the code rotates automatically.

### 1:20–2:25 — Attendee claim

- Open Claim view on a phone or second browser.
- Listen for the tone; if venue noise blocks microphone recognition, use the clearly labeled manual fallback.
- Show detected code, connect wallet, and submit the claim.

### 2:25–3:15 — Monad moment

- Show pending → confirmed transition.
- Open the Monad explorer transaction.
- Emphasize that public state changes quickly enough to remain part of one interaction.

### 3:15–4:00 — Public verification

- Open Verify view and show the wallet has the event credential.
- Show live attendee count updating.

### 4:00–4:30 — Replay protection

- Attempt the same wallet/event claim again.
- Show the contract rejection.

### 4:30–5:00 — Business and limits

“We sell organizer tools and usage-based verification. Sound is practical presence friction, not absolute anti-relay security; future versions can combine device attestation and venue infrastructure.”

## Submission checklist

- [ ] MOJO login works now.
- [ ] Team is created/joined before the submission phase.
- [ ] Team leader is identified and responsible for final submission.
- [ ] Public GitHub repository URL.
- [ ] Public frontend URL that remains live.
- [ ] Monad contract address and explorer URL.
- [ ] Successful claim transaction URL.
- [ ] Logo.
- [ ] Preview image with product name and Host/Claim/Verify story.
- [ ] Detailed description pasted and proofread.
- [ ] Vote for other projects for activity statistics.
- [ ] Final submission completed before the official deadline.
