# Initial Wedge and Ideal Customer Profile

## Why this matters

Building for every email user produces an unfocused product and a diluted
security story. Stealth is strongest where a single spoofed or unpriced message
can cause real, immediate loss, and where senders already carry a cryptographic
identity. This document selects one painful, frequent workflow as the launch
wedge, names the ideal customer profile (ICP), and records the assumptions we
must test before widening scope.

---

## 1. The chosen wedge

**Wedge:** Inbound-sender verification and access control for **crypto-native
teams**.

These teams coordinate money movements, contract addresses, signer approvals,
and partner deals over channels where impersonation is trivial and expensive.
Stealth's core promise — *access is earned, not assumed*, backed by verifiable
Stellar identity, priced access for unknown senders, and tamper-evident
delivery proof — maps directly onto their most feared failure mode: a single
convincing spoof that drains a treasury or misleads the community.

We start here because this segment already holds wallets and understands
cryptographic identity, so the biggest adoption cost (key management) is low.

---

## 2. Ideal Customer Profile (one page)

### Firmographic qualifiers

| Attribute        | Qualifier                                                                             |
| :--------------- | :------------------------------------------------------------------------------------ |
| Organization type | Crypto-native: protocol teams, DAOs, funds, exchanges, wallet and infrastructure companies |
| Team size        | 5–150 people                                                                          |
| Geography        | Global, remote-first                                                                  |
| Identity posture | Members already custody wallets; Stellar or multi-chain presence is a plus            |
| Economic exposure | Messages routinely carry payment instructions, addresses, or signer coordination      |
| Budget owner     | Founder, head of security, operations lead, or chief of staff                         |
| Trigger context  | Recent phishing incident, treasury scare, or high-profile impersonation of the brand  |

### Behavioral qualifiers

| Signal            | What we look for                                                                       |
| :---------------- | :------------------------------------------------------------------------------------- |
| High-stakes messaging | A single spoofed message can move funds or damage reputation                        |
| Fragmented channels | Coordinates over email plus Telegram/Discord, where impersonation is rife            |
| Security-conscious | Uses hardware wallets, multisig, and 2FA as a matter of habit                         |
| Tool-adoptive     | Comfortable installing new tools, holding keys, and paying in crypto                   |
| Gatekeeping pain  | Leaders and treasuries receive heavy, risky, unsolicited inbound                       |

---

## 3. Buyer vs. user distinction

- **Buyer / champion:** founder, head of security/operations, or chief of staff.
  Owns the "never again" mandate after an incident and controls tooling budget.
- **Primary users:** internal team members who send and receive high-stakes
  messages, plus the external counterparties (investors, auditors, partners)
  they invite to verify identity.
- **Note:** initial value lands even if only the internal team adopts, because
  inbound gating and identity verification protect them regardless of whether
  the whole ecosystem has migrated.

---

## 4. Top three jobs to be done

Ranked by combined urgency and frequency.

| Rank | Job (as the customer frames it)                                                                 | Urgency | Frequency |
| :--- | :---------------------------------------------------------------------------------------------- | :------ | :-------- |
| 1    | "When an unknown sender contacts us, prove who they really are before I trust a payment instruction or a link." | High    | High (daily inbound) |
| 2    | "When we publish a handle or address, stop attackers from impersonating us to our community."   | High    | Medium (ongoing) |
| 3    | "When money or sensitive files move over a message, give me tamper-evident proof of delivery."  | Medium  | Medium |

---

## 5. Adoption trigger

The dominant trigger is a **phishing or impersonation incident, or a near
miss**, that touches the treasury or leadership — the "never again" moment.

A secondary trigger is **onboarding a new high-value counterparty** (an
investor, auditor, or partner) who must be verified before sensitive
coordination begins.

---

## 6. Five falsifiable assumptions with tests

| #   | Assumption                                                                            | Test                                                                 | Keep signal (else kill/revise)                          |
| :-- | :------------------------------------------------------------------------------------ | :------------------------------------------------------------------- | :------------------------------------------------------ |
| A1  | Crypto-native teams rank impersonation/phishing as a top-three operational risk.      | Structured interviews with 10 qualified teams.                       | At least 7 of 10 place it in their top three.           |
| A2  | Members will manage encryption keys without dropping off.                             | Guided onboarding with 5 teams; observe unaided key setup.           | At least 60% complete key setup without live support.   |
| A3  | Teams will pay to gate unknown senders (subscription or postage).                     | Pricing interviews and letters of intent for a paid pilot.           | At least 3 teams verbally commit to a paid pilot.       |
| A4  | Verifiable Stellar identity is trusted more than email/domain for high-value asks.    | Blind message-ranking test comparing identity badge vs. domain-only. | Identity badge measurably raises the trust rating.      |
| A5  | External counterparties will accept an invite to receive/verify a Stealth message.    | Outbound invite test to real counterparties.                         | At least 40% of invited counterparties complete verification. |

---

## 7. Explicit non-goals

- Not a general consumer email replacement at launch.
- Not targeting non-crypto enterprises or regulated legacy inboxes first.
- No full SMTP interoperability parity inside the wedge (bridging comes later).
- No native mobile app requirement for the initial pilot.
- Not optimizing for high-volume newsletter or marketing senders.

---

## 8. Deferred segments

| Segment                                   | Why deferred                                              | Revisit when                                        |
| :---------------------------------------- | :-------------------------------------------------------- | :-------------------------------------------------- |
| Executive inboxes / assistant gatekeeping | Broad, less crypto-native; slower identity adoption       | Identity + postage flows are proven with the wedge  |
| Security-sensitive orgs (legal, press, health) | Compliance and retention requirements add scope           | We can meet baseline compliance needs               |
| Paid expert / creator inbox monetization  | Depends on mature postage and settlement rails            | Postage economics are validated in production       |
| Mainstream privacy-conscious consumers    | Needs legacy interoperability and mobile-first experience | Legacy bridge and mobile client exist               |

---

## 9. Success signal

At least **five design partners** from the chosen ICP agree to test the same
core workflow (inbound-sender verification and access control) within 30 days.
