# Product Purchases Rules

How goods reach the school's shelves, and how the suppliers who sent them get paid.

Everything on this page is a rule the school set. The decisions *we* took building it are in
`ProductPurchasesDesign.md`; the wire format is `ProductPurchasesContract.md`.

---

## Goods arrive against the supplier's own comprobante

A delivery comes with the supplier's factura or boleta — **their** document, not one the school
issues. The school records its type, series, number and date so the debt can be matched against it
later.

The same supplier comprobante is never recorded twice.

## The school owes from the moment the goods arrive

A purchase is on credit. From the day the goods are received the school owes that supplier, and the
debt has a due date agreed with them. It is settled by a separate payment, later.

## One payment can settle several invoices

The school pays a supplier a sum of money, and it clears the oldest invoices first. A payment never
exceeds what is owed — there is no credit balance sitting with a supplier.

## Received goods go straight onto the shelf

Everything on a purchase is counted into stock at the quantity received. There is no separate
"put it away" step.

## A purchase can be annulled only before it is paid

A purchase entered by mistake is annulled: the debt is cancelled and the goods come back out of
stock. Once the school has paid any part of it, that is no longer a data correction — the money moved,
and reversing it is a payment matter.
