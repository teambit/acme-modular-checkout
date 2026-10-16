import { Money } from '@acme-modular/platform.entities.money';
import { summarizeOrder } from '@acme-modular/store.cart.order-summary';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { PriceTag } from '@acme-modular/design.ui.price-tag';
import styles from './checkout-summary.module.css';

/** the store's bulk deal: 10 or more units take 10% off the subtotal. */
const bulkDeal = { bulkThreshold: 10, bulkDiscountPercent: 10 };

export type CheckoutTotals = {
  subtotalCents: number;
  /** 0 when the cart is below the bulk threshold. */
  discountCents: number;
  /** 0 until a delivery option is chosen. */
  shippingCents: number;
  totalCents: number;
};

/**
 * Totals a cart for checkout with the same bulk-discount rule as the cart
 * (via `summarizeOrder`), plus shipping. Everything stays in integer cents.
 */
export function checkoutTotals(lines: CartLine[], shippingCents = 0): CheckoutTotals {
  const summary = summarizeOrder(lines, bulkDeal);
  const subtotal = new Money(summary.subtotalCents);
  // summarizeOrder only reports display strings for the discount, so recompute it in cents with the same floor rounding.
  const discount = summary.discount ? subtotal.percent(summary.discount.percent) : Money.zero();
  const total = subtotal.subtract(discount).add(new Money(shippingCents));
  return {
    subtotalCents: subtotal.amountCents,
    discountCents: discount.amountCents,
    shippingCents,
    totalCents: total.amountCents,
  };
}

export type CheckoutSummaryProps = {
  /** the cart lines being bought. */
  lines: CartLine[];
  /** the chosen delivery price. omit it before delivery is chosen. */
  shippingCents?: number;
};

/**
 * The order summary on the checkout review: each line, the subtotal, the
 * bulk discount when it applies, shipping and the total.
 */
export function CheckoutSummary({ lines, shippingCents }: CheckoutSummaryProps) {
  const totals = checkoutTotals(lines, shippingCents ?? 0);
  return (
    <section className={styles.checkoutSummary} aria-label="Order summary">
      <ul className={styles.lines}>
        {lines.map((line) => (
          <li key={line.productId} className={styles.row}>
            <span>
              {line.name} <span className={styles.quantity}>× {line.quantity}</span>
            </span>
            <PriceTag cents={line.unitPriceCents * line.quantity} size="small" />
          </li>
        ))}
      </ul>
      <dl className={styles.totals}>
        <div className={styles.row}>
          <dt>Subtotal</dt>
          <dd>
            <PriceTag cents={totals.subtotalCents} size="small" />
          </dd>
        </div>
        {totals.discountCents > 0 && (
          <div className={styles.row}>
            <dt>Bulk discount ({bulkDeal.bulkDiscountPercent}%)</dt>
            <dd className={styles.discount}>
              <PriceTag cents={-totals.discountCents} size="small" />
            </dd>
          </div>
        )}
        <div className={styles.row}>
          <dt>Shipping</dt>
          <dd>
            {shippingCents === undefined ? (
              <span className={styles.pending}>Chosen at delivery</span>
            ) : (
              <PriceTag cents={shippingCents} size="small" />
            )}
          </dd>
        </div>
        <div className={`${styles.row} ${styles.total}`}>
          <dt>Total</dt>
          <dd>
            <PriceTag cents={totals.totalCents} size="large" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
