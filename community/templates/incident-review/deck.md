<!-- layout: center -->
^ Postmortem · INC-142
# Checkout latency spike
Blameless review · 42 minutes of degraded service

---

## Impact

:::stats style=big
- 42m | Degraded
- 18% | Checkouts slowed
- 0 | Data lost
:::

---

## Timeline

:::timeline style=v
- 09:12 | p99 latency alert fires
- 09:20 | Rollback of release 5.3.1
- 09:34 | Cache warmed, latency normal
- 09:54 | Incident closed
:::

---

## Root cause

```mermaid
flowchart LR
  A[Release 5.3.1] --> B[Cache key change]
  B --> C[Cold cache]
  C --> D[DB overload]
```

---

## Follow-ups

- [ ] Canary cache hit-rate before full rollout
- [ ] Alert on cache miss ratio, not just latency
- [ ] Runbook: warm cache after key changes
