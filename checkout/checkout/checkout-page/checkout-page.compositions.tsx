import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockProducts } from '@acme-modular/platform.entities.product';
import type { Product } from '@acme-modular/platform.entities.product';
import { CartProvider } from '@acme-modular/store.cart.use-cart';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CheckoutPage } from './checkout-page.js';

function lineFor(product: Product, quantity: number): CartLine {
  return { productId: product.id, name: product.name, unitPriceCents: product.price.amountCents, quantity };
}

const products = mockProducts();
const byId = (id: string) => products.find((product) => product.id === id)!;

export const CheckoutWithCart = () => (
  <AcmeTheme>
    <CartProvider initialLines={[lineFor(byId('p-100'), 1), lineFor(byId('p-600'), 1), lineFor(byId('p-300'), 2)]}>
      <CheckoutPage onDone={(order) => console.log('placed', order.id)} />
    </CartProvider>
  </AcmeTheme>
);

export const BulkOrderCheckout = () => (
  <AcmeTheme>
    <CartProvider initialLines={[lineFor(byId('p-300'), 12)]}>
      <CheckoutPage />
    </CartProvider>
  </AcmeTheme>
);

export const EmptyCartCheckout = () => (
  <AcmeTheme>
    <CartProvider>
      <CheckoutPage />
    </CartProvider>
  </AcmeTheme>
);
