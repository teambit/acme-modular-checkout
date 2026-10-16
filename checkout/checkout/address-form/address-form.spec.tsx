import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockCustomer } from '@acme-modular/platform.entities.customer';
import { AddressForm, validateAddress } from './address-form.js';

function type(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

it('does not submit until the required fields are filled', () => {
  const onSubmit = vi.fn();
  render(<AddressForm onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save address' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText('Enter the recipient name')).toBeTruthy();
  expect(screen.getByText('Enter the street address')).toBeTruthy();
});

it('requires a 5-digit ZIP in the US, but not elsewhere', () => {
  const address = { name: 'Jordan', line1: '1 Main St', city: 'Austin', region: 'TX', postalCode: '7870', country: 'US' };
  expect(validateAddress(address).postalCode).toBe('Enter a 5-digit ZIP code');
  expect(validateAddress({ ...address, postalCode: '78701' })).toEqual({});
  expect(validateAddress({ ...address, country: 'GB', postalCode: 'SW1A 1AA' })).toEqual({});
});

it('submits a new address with a generated id and the Shipping label', () => {
  const onSubmit = vi.fn();
  render(<AddressForm onSubmit={onSubmit} submitLabel="Continue" />);
  type(/full name/i, 'Jordan Rivera');
  type(/street address/i, '12 Elm Street');
  type(/city/i, 'Austin');
  type(/state/i, 'TX');
  type(/zip code/i, ' 78701 ');
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

  const address = onSubmit.mock.calls[0][0];
  expect(address).toMatchObject({ label: 'Shipping', name: 'Jordan Rivera', postalCode: '78701', country: 'US' });
  expect(address.id).toMatch(/^a-/);
  expect(address.line2).toBeUndefined();
});

it('keeps the id and label of an address it edits', () => {
  const onSubmit = vi.fn();
  const office = mockCustomer().defaultAddress!;
  render(<AddressForm value={office} onSubmit={onSubmit} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save address' }));
  expect(onSubmit).toHaveBeenCalledWith(office);
});
