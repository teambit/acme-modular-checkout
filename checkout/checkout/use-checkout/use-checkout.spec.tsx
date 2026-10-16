import type { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import type { MockRoutes } from '@acme-modular/platform.utils.http-client';
import { mockCustomer } from '@acme-modular/platform.entities.customer';
import { CartProvider, useCart } from '@acme-modular/store.cart.use-cart';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import type { DeliveryOption } from '@acme-modular/shipping.shipping.delivery-options';
import { useCheckout } from './use-checkout.js';

const initialLines: CartLine[] = [
  { productId: 'p-100', name: 'Standing Desk', unitPriceCents: 39900, quantity: 1 },
  { productId: 'p-300', name: 'Desk Lamp', unitPriceCents: 4900, quantity: 2 },
];
const address = mockCustomer().defaultAddress!;
const standard: DeliveryOption = { id: 'standard', label: 'Standard', days: 5, cents: 900 };

const routes: MockRoutes = {
  'POST /orders': async (request) => ({ id: 'o-2001', ...(await request.json()) }),
  'POST /payments': async (request) => ({ id: 'pay-1', ...(await request.json()) }),
};

function setup(overrides: MockRoutes = {}) {
  const client = createHttpClient({ transport: createMockTransport({ ...routes, ...overrides }, { latencyMs: 0 }) });
  const wrapper = ({ children }: { children: ReactNode }) => <CartProvider initialLines={initialLines}>{children}</CartProvider>;
  return renderHook(() => ({ checkout: useCheckout({ client }), cart: useCart() }), { wrapper });
}

it('steps through address, delivery, payment and review', () => {
  const { result } = setup();
  expect(result.current.checkout.step).toBe('address');

  // can't skip ahead without an address
  act(() => result.current.checkout.next());
  expect(result.current.checkout.step).toBe('address');

  act(() => result.current.checkout.setAddress(address));
  expect(result.current.checkout.step).toBe('delivery');

  act(() => result.current.checkout.setDelivery(standard));
  expect(result.current.checkout.step).toBe('delivery');

  act(() => result.current.checkout.next());
  expect(result.current.checkout.step).toBe('payment');
  expect(result.current.checkout.paymentMethod).toBe('card');

  act(() => result.current.checkout.back());
  expect(result.current.checkout.step).toBe('delivery');

  act(() => result.current.checkout.next());
  act(() => result.current.checkout.setPaymentMethod('invoice'));
  act(() => result.current.checkout.next());
  expect(result.current.checkout.step).toBe('review');
  expect(result.current.checkout.paymentMethod).toBe('invoice');
});

it('places the order, pays for it and clears the cart', async () => {
  const { result } = setup();
  act(() => result.current.checkout.setAddress(address));
  act(() => result.current.checkout.setDelivery(standard));

  let placedId: string | undefined;
  await act(async () => {
    placedId = (await result.current.checkout.placeOrder()).id;
  });

  expect(placedId).toBe('o-2001');
  expect(result.current.checkout.step).toBe('placed');
  expect(result.current.checkout.placing).toBe(false);
  // 39900 + 2 x 4900 + 900 shipping, no bulk discount below 10 units
  expect(result.current.checkout.order?.total.amountCents).toBe(50600);
  expect(result.current.cart.lines).toEqual([]);
});

it('keeps the cart and reports the error when the payment fails', async () => {
  const { result } = setup({
    'POST /payments': () => {
      throw new Error('card declined');
    },
  });
  act(() => result.current.checkout.setAddress(address));
  act(() => result.current.checkout.setDelivery(standard));
  act(() => result.current.checkout.next());
  act(() => result.current.checkout.next());

  await act(async () => {
    await result.current.checkout.placeOrder().catch(() => undefined);
  });

  expect(result.current.checkout.error?.message).toBe('card declined');
  expect(result.current.checkout.step).toBe('review');
  expect(result.current.cart.lines).toHaveLength(2);
});
