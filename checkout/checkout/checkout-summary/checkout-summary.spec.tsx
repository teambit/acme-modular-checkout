import { render, screen } from '@testing-library/react';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CheckoutSummary, checkoutTotals } from './checkout-summary.js';

const desk: CartLine = { productId: 'p-100', name: 'Standing Desk', unitPriceCents: 39900, quantity: 1 };
const lamps: CartLine = { productId: 'p-300', name: 'Desk Lamp', unitPriceCents: 4900, quantity: 12 };

it('totals subtotal and shipping without a discount below the threshold', () => {
  expect(checkoutTotals([desk], 2500)).toEqual({
    subtotalCents: 39900,
    discountCents: 0,
    shippingCents: 2500,
    totalCents: 42400,
  });
});

it('takes 10% off at 10 or more units', () => {
  // 12 lamps: 58800 subtotal, 5880 off, plus 900 shipping
  expect(checkoutTotals([lamps], 900)).toMatchObject({ discountCents: 5880, totalCents: 53820 });
});

it('renders lines, the discount and the total', () => {
  render(<CheckoutSummary lines={[desk, lamps]} shippingCents={2500} />);
  expect(screen.getByText('Bulk discount (10%)')).toBeTruthy();
  // 98700 subtotal - 9870 discount + 2500 shipping
  expect(screen.getByText('$913.30')).toBeTruthy();
  expect(screen.getByText('Standing Desk')).toBeTruthy();
});

it('shows shipping as pending until delivery is chosen', () => {
  render(<CheckoutSummary lines={[desk]} />);
  expect(screen.getByText('Chosen at delivery')).toBeTruthy();
  expect(screen.queryByText(/bulk discount/i)).toBeNull();
});
