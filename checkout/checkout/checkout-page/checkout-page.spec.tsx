import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createHttpClient, createMockTransport } from '@acme-modular/platform.utils.http-client';
import { CartProvider } from '@acme-modular/store.cart.use-cart';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CheckoutPage } from './checkout-page.js';

const lines: CartLine[] = [{ productId: 'p-300', name: 'Desk Lamp', unitPriceCents: 4900, quantity: 2 }];

const client = createHttpClient({
  transport: createMockTransport(
    {
      'POST /orders': async (request) => ({ id: 'o-2001', ...(await request.json()) }),
      'POST /payments': async (request) => ({ id: 'pay-1', ...(await request.json()) }),
    },
    { latencyMs: 0 }
  ),
});

function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

it('tells the customer when the cart is empty', () => {
  render(
    <CartProvider>
      <CheckoutPage client={client} />
    </CartProvider>
  );
  expect(screen.getByText('Your cart is empty')).toBeTruthy();
});

it('walks from the address to a placed order', async () => {
  const onDone = vi.fn();
  render(
    <CartProvider initialLines={lines}>
      <CheckoutPage client={client} onDone={onDone} />
    </CartProvider>
  );

  type(/full name/i, 'Jordan Rivera');
  type(/street address/i, '12 Elm Street');
  type(/city/i, 'Austin');
  type(/state/i, 'TX');
  type(/zip code/i, '78701');
  fireEvent.click(screen.getByRole('button', { name: 'Continue to delivery' }));

  // standard delivery is preselected
  fireEvent.click(await screen.findByRole('button', { name: 'Continue to payment' }));

  fireEvent.click(screen.getByRole('radio', { name: /invoice/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Continue to review' }));

  expect(screen.getByText(/12 Elm Street/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Place order' }));

  expect(await screen.findByText('Order placed')).toBeTruthy();
  await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  expect(onDone.mock.calls[0][0].id).toBe('o-2001');
});

it('asks for card details before review when paying by card', async () => {
  render(
    <CartProvider initialLines={lines}>
      <CheckoutPage client={client} />
    </CartProvider>
  );
  type(/full name/i, 'Jordan Rivera');
  type(/street address/i, '12 Elm Street');
  type(/city/i, 'Austin');
  type(/state/i, 'TX');
  type(/zip code/i, '78701');
  fireEvent.click(screen.getByRole('button', { name: 'Continue to delivery' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Continue to payment' }));

  type(/card number/i, '4242 4242 4242 4242');
  type(/expiry/i, '12/49');
  type(/security code/i, '123');
  fireEvent.click(screen.getByRole('button', { name: 'Continue to review' }));

  expect(screen.getByText('Visa ending in 4242')).toBeTruthy();
});
