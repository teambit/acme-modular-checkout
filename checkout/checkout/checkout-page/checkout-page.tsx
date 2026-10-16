import { useEffect, useState } from 'react';
import classNames from 'classnames';
import type { HttpClient } from '@acme-modular/platform.utils.http-client';
import type { Order } from '@acme-modular/platform.entities.order';
import { useCart } from '@acme-modular/store.cart.use-cart';
import { Alert } from '@acme-modular/design.ui.alert';
import { Button } from '@acme-modular/design.ui.button';
import { Card } from '@acme-modular/design.ui.card';
import { PriceTag } from '@acme-modular/design.ui.price-tag';
import { Spinner } from '@acme-modular/design.ui.spinner';
import { Stack } from '@acme-modular/design.ui.stack';
import { DeliveryOptions, deliveryOptionsFor } from '@acme-modular/shipping.shipping.delivery-options';
import { PaymentMethodPicker, paymentMethodLabel } from '@acme-modular/payments.payments.payment-method-picker';
import { CardForm } from '@acme-modular/payments.payments.card-form';
import type { CardDetails } from '@acme-modular/payments.payments.card-form';
import { brandName } from '@acme-modular/payments.payments.card-validation';
import { AddressForm } from '@acme-modular/checkout.checkout.address-form';
import { CheckoutSummary } from '@acme-modular/checkout.checkout.checkout-summary';
import { useCheckout } from '@acme-modular/checkout.checkout.use-checkout';
import type { CheckoutStep } from '@acme-modular/checkout.checkout.use-checkout';
import styles from './checkout-page.module.css';

/** parcels are quoted at a flat 2 kg per unit until products carry a weight. */
const KG_PER_UNIT = 2;
/** every order ships from the warehouse into zone 1 for now. */
const ZONE = 1;

const stepTitles: Array<[Exclude<CheckoutStep, 'placed'>, string]> = [
  ['address', 'Address'],
  ['delivery', 'Delivery'],
  ['payment', 'Payment'],
  ['review', 'Review'],
];

function businessDays(days: number) {
  return days === 1 ? '1 business day' : `${days} business days`;
}

export type CheckoutPageProps = {
  /** the orders and payments backend. defaults to the in-memory mock of `useCheckout`. */
  client?: HttpClient;
  /** called with the order once it is placed and paid, e.g. to navigate to it. */
  onDone?(order: Order): void;
};

/**
 * The ACME checkout: shipping address, delivery option, payment method (and
 * card details for card payments), a review with the order summary, then an
 * "Order placed" confirmation. Must be rendered inside `CartProvider`.
 */
export function CheckoutPage({ client, onDone }: CheckoutPageProps) {
  const checkout = useCheckout({ client });
  const { lines, itemCount } = useCart();
  const [card, setCard] = useState<CardDetails>();
  const weightKg = itemCount * KG_PER_UNIT;
  const { step, delivery, setDelivery } = checkout;

  // preselect the cheapest option so "Continue" works without an extra click.
  useEffect(() => {
    if (step === 'delivery' && !delivery) setDelivery(deliveryOptionsFor(weightKg, ZONE)[0]);
  }, [step, delivery, setDelivery, weightKg]);

  if (step === 'placed' && checkout.order) {
    const { order } = checkout;
    return (
      <div className={styles.checkoutPage}>
        <Alert tone="positive" title="Order placed">
          Thank you! Order {order.id} for <PriceTag cents={order.total.amountCents} size="small" /> is confirmed.
          {checkout.delivery && ` Expect it in ${businessDays(checkout.delivery.days)}.`}
        </Alert>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className={styles.checkoutPage}>
        <Alert tone="info" title="Your cart is empty">
          Add a few products to your cart before checking out.
        </Alert>
      </div>
    );
  }

  function placeOrder() {
    // a failure is already in `checkout.error` and shown on the review step.
    checkout.placeOrder().then((order) => onDone?.(order), () => undefined);
  }

  const backButton = (
    <Button variant="ghost" onClick={checkout.back}>
      Back
    </Button>
  );

  return (
    <div className={styles.checkoutPage}>
      <ol className={styles.steps} aria-label="Checkout steps">
        {stepTitles.map(([id, title], index) => (
          <li
            key={id}
            aria-current={step === id ? 'step' : undefined}
            className={classNames(styles.step, step === id && styles.current)}
          >
            <span className={styles.stepNumber}>{index + 1}</span> {title}
          </li>
        ))}
      </ol>

      <div className={styles.layout}>
        <div className={styles.main}>
          {step === 'address' && (
            <Card title="Shipping address">
              <AddressForm value={checkout.address} onSubmit={checkout.setAddress} submitLabel="Continue to delivery" />
            </Card>
          )}

          {step === 'delivery' && (
            <Card
              title="Delivery"
              footer={
                <Stack direction="row" justify="space-between">
                  {backButton}
                  <Button onClick={checkout.next} disabled={!delivery}>
                    Continue to payment
                  </Button>
                </Stack>
              }
            >
              <DeliveryOptions weightKg={weightKg} zone={ZONE} value={delivery?.id} onChange={setDelivery} />
            </Card>
          )}

          {step === 'payment' && (
            <Card title="Payment" footer={backButton}>
              <Stack gap="large">
                <PaymentMethodPicker value={checkout.paymentMethod} onChange={checkout.setPaymentMethod} />
                {checkout.paymentMethod === 'card' ? (
                  <CardForm
                    submitLabel="Continue to review"
                    onSubmit={(details) => {
                      setCard(details);
                      checkout.next();
                    }}
                  />
                ) : (
                  <Button onClick={checkout.next}>Continue to review</Button>
                )}
              </Stack>
            </Card>
          )}

          {step === 'review' && (
            <Card
              title="Review your order"
              footer={
                <Stack direction="row" justify="space-between" align="center">
                  {backButton}
                  {checkout.placing ? (
                    <Spinner label="Placing your order" size="small" />
                  ) : (
                    <Button onClick={placeOrder}>Place order</Button>
                  )}
                </Stack>
              }
            >
              <Stack gap="medium">
                <dl className={styles.review}>
                  {checkout.address && (
                    <div>
                      <dt>Ship to</dt>
                      <dd>
                        {checkout.address.name}, {checkout.address.line1}
                        {checkout.address.line2 && `, ${checkout.address.line2}`}, {checkout.address.city},{' '}
                        {checkout.address.region} {checkout.address.postalCode}, {checkout.address.country}
                      </dd>
                    </div>
                  )}
                  {delivery && (
                    <div>
                      <dt>Delivery</dt>
                      <dd>
                        {delivery.label}, {businessDays(delivery.days)}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt>Payment</dt>
                    <dd>
                      {checkout.paymentMethod === 'card' && card
                        ? `${brandName(card.brand)} ending in ${card.last4}`
                        : paymentMethodLabel(checkout.paymentMethod)}
                    </dd>
                  </div>
                </dl>
                {checkout.error && (
                  <Alert tone="negative" title="We couldn't place your order">
                    {checkout.error.message}
                  </Alert>
                )}
              </Stack>
            </Card>
          )}
        </div>

        <aside className={styles.aside}>
          <Card title="Order summary">
            <CheckoutSummary lines={lines} shippingCents={delivery?.cents} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
