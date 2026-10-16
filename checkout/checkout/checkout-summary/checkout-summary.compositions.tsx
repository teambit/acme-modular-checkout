import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockProducts } from '@acme-modular/platform.entities.product';
import type { Product } from '@acme-modular/platform.entities.product';
import type { CartLine } from '@acme-modular/store.cart.use-cart';
import { CheckoutSummary } from './checkout-summary.js';

function lineFor(product: Product, quantity: number): CartLine {
  return { productId: product.id, name: product.name, unitPriceCents: product.price.amountCents, quantity };
}

const [desk, , chair, , lamp] = mockProducts();

export const SmallOrder = () => (
  <AcmeTheme>
    <div style={{ maxWidth: 420 }}>
      <CheckoutSummary lines={[lineFor(desk, 1), lineFor(chair, 1)]} shippingCents={2500} />
    </div>
  </AcmeTheme>
);

export const BulkDiscount = () => (
  <AcmeTheme>
    <div style={{ maxWidth: 420 }}>
      <CheckoutSummary lines={[lineFor(lamp, 12)]} shippingCents={900} />
    </div>
  </AcmeTheme>
);

export const BeforeDelivery = () => (
  <AcmeTheme>
    <div style={{ maxWidth: 420 }}>
      <CheckoutSummary lines={[lineFor(desk, 1), lineFor(lamp, 2)]} />
    </div>
  </AcmeTheme>
);
