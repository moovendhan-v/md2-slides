---
team: Platform
sprint: 24
---
<!-- layout: center -->
^ ${team} team · Sprint ${sprint}
# What we shipped
Two weeks, one goal: faster deploys.

---

## Sprint goal met

:::stats style=boxed
- 11 / 12 | Stories done | +3
- 34 | Points delivered | +6
- 2 | Bugs carried over | -4
:::

Note: Call out the one story that slipped and why.

---

## Shipped

:::cards style=iconLeft cols=2
- rocket | Preview deploys | Every PR gets its own URL
- clock | Build cache | CI time down from 9 to 4 minutes
- shield-check | Secret scanning | Blocks pushes with leaked keys
- chart-line-up | Deploy dashboard | Live status for every service
:::

---

## Demo

:::terminal zsh
$ deploy preview --pr 482
Building… done in 38s
Preview ready → https://pr-482.preview.dev
:::

Note: Run the live demo here; fall back to the recording if wifi drops.

---

## What we learned

- [x] Pairing on the cache work saved a week
- [x] Small PRs got reviewed same day
- [ ] Flaky e2e tests still cost us time

---

## Next sprint

:::timeline style=h
- Week 1 | Fix flaky e2e tests
- Week 1 | Roll out preview deploys to all repos
- Week 2 | Canary releases?
:::

---

<!-- layout: statement -->
# Questions and feedback welcome
