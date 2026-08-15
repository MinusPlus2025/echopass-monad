# EchoPass — 5-Minute Demo Runbook

## Demo principle

No slide deck unless the live environment becomes unstable. The browser and Monad explorer are the presentation. Aim for 3:20 of live operation, 1:10 of technical explanation, and 0:30 for innovation and close.

## Exact five-minute sequence

### 0:00–0:20 — Start with the product

Open the Host view with the event already created.

Say:

> 固定二维码可以被截图和转发。EchoPass 把现场正在播放的声音，变成一个与钱包绑定、短时有效的 Monad 领取凭证。

Do not explain the market, team, or background yet.

### 0:20–0:55 — Broadcast the rotating challenge

- Point to the six-digit code and 30-second countdown.
- Press **Play sound**.
- Show the code changing at the next time window if timing allows.

Say:

> 主办方播放的是每 30 秒轮换的六位声音挑战。声音不是装饰，而是领取授权的入口。

### 0:55–1:45 — Claim on a second browser or phone

- Open Claim view.
- Detect the sound through the microphone.
- If the room is noisy, immediately use the clearly labelled manual fallback.
- Connect the attendee wallet.
- Submit the real Monad testnet transaction.

Say while the transaction is pending:

> 识别结果只换来一个 90 秒有效的签名凭证。签名同时绑定活动、合约、钱包、声音信号和过期时间，因此转发给另一个钱包不能直接使用。

### 1:45–2:25 — Show the Monad result

- Show the confirmed state and transaction hash.
- Open the transaction in the Monad explorer.
- Return to Verify and show the wallet/event credential and updated claim count.

Say:

> Monad 的快速确认让“听见、领取、公开验证”保持在一个连续的现场动作里，而不是签到后等待后台同步。

### 2:25–2:55 — Demonstrate replay rejection

- Try to claim the same event with the same wallet again.
- Show the contract rejection or the frontend's onchain duplicate state.

Say:

> 防重复不是中心化数据库规则，而是合约公开执行的一次一钱包约束。

### 2:55–3:55 — Explain how it works

Keep the live app or a single architecture image visible.

Say:

> 我们从零构建了三层：第一层用 Web Audio 编码和识别 DTMF 风格的六位声音码；第二层把声音结果转换成 EIP-191 签名凭证；第三层由 Monad 合约检查签名、活动时间、凭证有效期和重复领取状态，再原子化发放参与凭证和可选奖励。最有趣的技术挑战，是让浏览器声音识别、钱包签名边界和 Solidity 中的摘要字段顺序完全一致。

### 3:55–4:35 — State the innovation honestly

Say:

> EchoPass 不是把二维码换成另一张图。它尝试的是一种声音原生的链上交互：一个空间中的短暂声学事件，如何变成公开、可验证、不可重复的链上状态。它不声称绝对证明地理位置；它通过短时效、钱包绑定和链上防重放，提高静态截图分享和批量领取的成本。

### 4:35–5:00 — Close

Say:

> 今天我们验证了最小闭环：声音挑战、钱包绑定、Monad 领取和公开验证。下一步可以服务黑客松、工作坊、音乐现场和品牌活动，让签到、奖励与社区关系不再锁在单个平台里。EchoPass：听见现场，领取凭证。

Stop. Do not add extra features or a long commercial pitch.

## Developer-facing proof points

- Show a real Monad explorer transaction, not only a success animation.
- Show the contract address in the UI or explorer.
- Point out the exact signed fields: chain ID, contract, event ID, claimant, signal hash, expiry.
- Trigger a duplicate claim failure.
- If possible, show a second wallet cannot reuse the first wallet's voucher.
- Use clear language: practical anti-sharing friction, not absolute proof of physical presence.

## Live setup checklist

- [ ] Host event already exists on Monad testnet.
- [ ] Host and attendee wallets contain sufficient test MON.
- [ ] Contract has enough optional reward funding for the demo.
- [ ] Host view open in desktop browser.
- [ ] Claim view open on phone or second browser profile.
- [ ] Monad explorer contract and successful transaction bookmarked.
- [ ] Browser microphone permission granted before going on stage.
- [ ] System audio volume tested at the actual venue.
- [ ] Manual-code fallback tested and visibly labelled.
- [ ] Duplicate claim path tested against the deployed contract.
- [ ] Notifications, password-manager popups, and unrelated tabs closed.

## Backup package

Capture these after final deployment:

1. Host screen with code and countdown.
2. Claim screen with detected code.
3. Wallet confirmation or transaction-pending state.
4. Confirmed state with transaction hash.
5. Monad explorer transaction and contract address.
6. Verify screen with credential.
7. Duplicate-claim rejection.

Also record one uninterrupted 45–60 second video of the full claim loop. Keep the video local and in a cloud-accessible backup. If live audio fails, use manual fallback; if the network fails, play the video and then show the already-confirmed explorer transaction.

## Rehearsal targets

- Rehearsal 1: functional, under 6:00.
- Rehearsal 2: remove explanations until under 5:10.
- Rehearsal 3: target 4:40 to leave 20 seconds of failure margin.
- Final rehearsal: use the actual phone, browser profiles, wallet, sound output, and deployed URLs.
