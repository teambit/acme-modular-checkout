import { useCallback, useState } from 'react';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import type { HttpClient } from '@acme-modular/platform.utils.http-client';
import { Order } from '@acme-modular/platform.entities.order';
import type { PlainOrder } from '@acme-modular/platform.entities.order';
import type { Address } from '@acme-modular/platform.entities.customer';
import { useCart } from '@acme-modular/store.cart.use-cart';
import type { DeliveryOption } from '@acme-modular/shipping.shipping.delivery-options';
import type { PaymentMethod } from '@acme-modular/payments.payments.payment-method-picker';
import { usePayment } from '@acme-modular/payments.payments.use-payment';
import { checkoutTotals } from '@acme-modular/checkout.checkout.checkout-summary';

export type CheckoutStep = 'address' | 'delivery' | 'payment' | 'review' | 'placed';

export type UseCheckoutOptions = {
  /** the orders and payments backend. defaults to an in-memory mock so previews work offline. */
  client?: HttpClient;
};

export type UseCheckoutResult = {
  step: CheckoutStep;
  address?: Address;
  delivery?: DeliveryOption;
  paymentMethod: PaymentMethod;
  /** the placed order, once `step` is `placed`. */
  order?: Order;
  /** stores the address and moves on to delivery. */
  setAddress(address: Address): void;
  /** stores the delivery option. stays on the step so the customer can compare. */
  setDelivery(option: DeliveryOption): void;
  setPaymentMethod(method: PaymentMethod): void;
  /** the next step, once the current one is complete. */
  next(): void;
  /** the previous step. */
  back(): void;
  /** creates the order, pays for it, clears the cart and moves to `placed`. */
  placeOrder(): Promise<Order>;
  placing: boolean;
  error?: Error;
};

const flow: CheckoutStep[] = ['address', 'delivery', 'payment', 'review'];

// the mock backend gives each order an id and echoes it back.
let mockOrderNumber = 2000;
const mockClient = createHttpClient({
  transport: createMockTransport(
    {
      'POST /orders': async (request) => ({ id: `o-${(mockOrderNumber += 1)}`, ...(await request.json()) }),
      'POST /payments': async (request) => {
        const payment = await request.json();
        return { id: `pay-${payment.orderId}`, ...payment };
      },
    },
    { latencyMs: 300 }
  ),
});

/**
 * Drives checkout: address → delivery → payment → review → placed. It reads
 * the cart from `useCart`, so it must be used inside `CartProvider`.
 *
 * @example
 * const checkout = useCheckout();
 * checkout.setAddress(address); // step is now 'delivery'
 * await checkout.placeOrder();  // step is now 'placed' and the cart is empty
 */
export function useCheckout({ client = mockClient }: UseCheckoutOptions = {}): UseCheckoutResult {
  const { lines, clear } = useCart();
  const { pay } = usePayment({ client });
  const [step, setStep] = useState<CheckoutStep>('address');
  const [address, setAddressState] = useState<Address>();
  const [delivery, setDelivery] = useState<DeliveryOption>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [order, setOrder] = useState<Order>();
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<Error>();

  const setAddress = useCallback((next: Address) => {
    setAddressState(next);
    setStep('delivery');
  }, []);

  const next = useCallback(() => {
    // a step is complete once what it collects is set. payment always has a method;
    // review only moves on through placeOrder.
    const complete = step === 'address' ? Boolean(address) : step === 'delivery' ? Boolean(delivery) : step === 'payment';
    if (complete) setStep(flow[flow.indexOf(step) + 1]);
  }, [step, address, delivery]);

  const back = useCallback(() => {
    const index = flow.indexOf(step);
    if (index > 0) setStep(flow[index - 1]);
  }, [step]);

  const placeOrder = useCallback(async () => {
    setPlacing(true);
    setError(undefined);
    try {
      if (!address || !delivery) throw new Error('choose an address and a delivery option first');
      if (!lines.length) throw new Error('the cart is empty');
      const totals = checkoutTotals(lines, delivery.cents);
      const draft: Omit<PlainOrder, 'id'> & { shippingAddress: Address; delivery: DeliveryOption['id'] } = {
        // the session lives in accounts; checkout places guest orders until it is wired in.
        customerId: 'guest',
        lines: lines.map(({ productId, name, unitPriceCents, quantity }) => ({ productId, name, unitPriceCents, quantity })),
        shippingCents: totals.shippingCents,
        discountCents: totals.discountCents,
        status: 'placed',
        createdAt: new Date().toISOString(),
        shippingAddress: address,
        delivery: delivery.id,
      };
      const placed = Order.from(await client.post<PlainOrder>('/orders', draft));
      await pay(placed, paymentMethod);
      clear();
      setOrder(placed);
      setStep('placed');
      return placed;
    } catch (caught) {
      const failure = caught instanceof Error ? caught : new Error(String(caught));
      setError(failure);
      throw failure;
    } finally {
      setPlacing(false);
    }
  }, [address, delivery, lines, client, pay, paymentMethod, clear]);

  return {
    step,
    address,
    delivery,
    paymentMethod,
    order,
    setAddress,
    setDelivery,
    setPaymentMethod,
    next,
    back,
    placeOrder,
    placing,
    error,
  };
}
