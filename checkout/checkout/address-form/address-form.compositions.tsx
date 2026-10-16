import { useState } from 'react';
import { AcmeTheme } from '@acme-modular/design.theme.acme-theme';
import { mockCustomer } from '@acme-modular/platform.entities.customer';
import type { Address } from '@acme-modular/platform.entities.customer';
import { AddressForm } from './address-form.js';

export const NewAddress = () => {
  const [saved, setSaved] = useState<Address>();
  return (
    <AcmeTheme>
      <AddressForm onSubmit={setSaved} submitLabel="Continue to delivery" />
      {saved && <pre>{JSON.stringify(saved, null, 2)}</pre>}
    </AcmeTheme>
  );
};

export const EditSavedAddress = () => (
  <AcmeTheme>
    <AddressForm value={mockCustomer().defaultAddress} onSubmit={(address) => alert(`Saved ${address.label}`)} />
  </AcmeTheme>
);

export const InternationalAddress = () => (
  <AcmeTheme>
    <AddressForm
      value={{ name: 'Jordan Rivera', line1: '221B Baker Street', city: 'London', region: 'Greater London', country: 'GB' }}
      onSubmit={(address) => alert(`Shipping to ${address.city}`)}
    />
  </AcmeTheme>
);
