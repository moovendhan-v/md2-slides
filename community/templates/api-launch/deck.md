<!-- layout: center -->
^ Now in beta
# The Payments API
Accept payments with three lines of code.

---

## Why developers switch

:::cards style=glass cols=3
- lightning | Fast | Median response under 80 ms
- shield-check | Safe | PCI handled for you
- code | Typed | SDKs for TS, Go and Python
:::

---

## Three lines

```ts checkout.ts {2|3}
import { Payments } from "@acme/payments";
const pay = new Payments(process.env.ACME_KEY);
await pay.charge({ amount: 4200, currency: "usd" });
```

---

## Pricing

| Plan | Price | Includes |
| --- | --- | --- |
| Starter | Free | 1k requests / month |
| Growth | 0.4% | Unlimited requests |
| Scale | Custom | SLA and support |

---

## Get started

> [!TIP] `npm i @acme/payments` and read the docs at acme.dev
