# Product Sales Rules

What happens at the counter when somebody buys a uniform or a book, and what paperwork it produces.

Everything on this page is a rule the school set. Someone at the school can confirm or deny every
line without knowing anything about the system. What the school sells and how it is priced is in
`Documentation/Products/ProductsRules.md`; the decisions *we* took building this are in
`ProductSalesDesign.md`; the wire format is `ProductSalesContract.md`.

---

## What is sold is a specific garment or book, never a category

When somebody buys an English book, they are not buying "the English book". They are buying the
edition the school stocks this year, from a named publisher, for a named grade — and that is a
different book, at a different price, from last year's or from another grade's.

The same is true of a garment: a size M *Polo buzo 2023* is not a size M *Polo buzo*. In 2023 the
school sold four different shorts side by side, and it has to know which of them a parent bought.

The sale therefore records the exact thing, not the family it belongs to.

## Who buys

A **student**, a **guardian**, or a **member of staff**. Every sale is in somebody's name; the school
does not sell to an unnamed member of the public.

## A sale is paid when it is made

Nothing leaves the counter unpaid. There is no account a family runs up at the shop, and no sale
waiting to be settled later.

The parent may pay with more than one means at once — part cash, part card. When a card is used the
acquirer's commission is charged on top of the price, as it is for any other payment the school
takes: the payer absorbs it.

## The receipt is internal

A product sale is documented with the school's own **recibo interno**. It is not a boleta and is not
filed with SUNAT.

## Nothing may be sold that is not on the shelf

The counter cannot sell more of something than it has. The stock figure comes from the movements
behind it (`Documentation/Products/ProductsRules.md`), and a sale is one of those movements.

## A sale can be annulled, and then it never happened

A sale rung up by mistake is annulled with a reason. The money is undone, the receipt is voided, and
the garments go back on the shelf — not as a return, because they never left. A sale that already has
a return recorded against it cannot be annulled until that return is dealt with first.

## Returns and exchanges

A garment can be handed back, on its own or swapped for another:

- swapped for something **dearer** — the parent pays the difference;
- swapped for something **cheaper**, or handed back with nothing in return — the school refunds it;
- swapped for something of the **same price** — no money changes hands.

What comes back is credited at **what the parent actually paid**, not at this year's price. Nothing
can be handed back twice, and never more than was bought.

A parent cannot, in one transaction, hand back a garment and take a book of greater value in
exchange: that is a return and a new sale, and the school records them as two things.

## A uniform is sold as several garments

The school thinks of a uniform as one thing a student needs, but sells it as its parts, with the size
of each chosen for that student at the counter. When a set has its own price for the year, that price
replaces the sum of its parts; the difference is spread across them so each garment still shows what
it cost. When it has no price of its own, the set is just a checklist.
