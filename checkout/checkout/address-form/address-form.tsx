import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { Address } from '@acme-modular/platform.entities.customer';
import { TextInput } from '@acme-modular/design.ui.text-input';
import { Button } from '@acme-modular/design.ui.button';
import styles from './address-form.module.css';

type AddressFields = Pick<Address, 'name' | 'line1' | 'city' | 'region' | 'postalCode' | 'country'> & { line2: string };

export type AddressErrors = Partial<Record<keyof AddressFields, string>>;

const countries: Array<{ code: string; name: string }> = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
];

const required: Array<[keyof AddressFields, string]> = [
  ['name', 'Enter the recipient name'],
  ['line1', 'Enter the street address'],
  ['city', 'Enter the city'],
  ['region', 'Enter the state or region'],
  ['postalCode', 'Enter the postal code'],
  ['country', 'Choose a country'],
];

/**
 * Checks an address before it is shipped to: every required field is filled
 * and a US address has a 5-digit ZIP code.
 *
 * @returns one message per invalid field. empty when the address is valid.
 */
export function validateAddress(address: Partial<Address>): AddressErrors {
  const errors: AddressErrors = {};
  for (const [field, message] of required) {
    if (!String(address[field] ?? '').trim()) errors[field] = message;
  }
  if (!errors.postalCode && address.country === 'US' && !/^\d{5}$/.test(address.postalCode!.trim())) {
    errors.postalCode = 'Enter a 5-digit ZIP code';
  }
  return errors;
}

function newAddressId() {
  return `a-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export type AddressFormProps = {
  /** an address to edit, or a partial one to prefill. */
  value?: Partial<Address>;
  /** called with the complete, trimmed address once it is valid. */
  onSubmit(address: Address): void;
  /** the submit button label. defaults to "Save address". */
  submitLabel?: string;
};

/**
 * A shipping address form. It validates the required fields on submit and
 * asks for a 5-digit ZIP when the country is the US. New addresses get an
 * `id` and the label "Shipping" unless the `value` brings its own.
 */
export function AddressForm({ value = {}, onSubmit, submitLabel = 'Save address' }: AddressFormProps) {
  const [fields, setFields] = useState<AddressFields>({
    name: value.name ?? '',
    line1: value.line1 ?? '',
    line2: value.line2 ?? '',
    city: value.city ?? '',
    region: value.region ?? '',
    postalCode: value.postalCode ?? '',
    country: value.country ?? 'US',
  });
  const [errors, setErrors] = useState<AddressErrors>({});
  const countryId = useId();
  const isUS = fields.country === 'US';

  const field = (name: keyof AddressFields) => ({
    name,
    value: fields[name],
    error: errors[name],
    onChange: (next: string) => setFields((current) => ({ ...current, [name]: next })),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(
      Object.entries(fields).map(([key, entry]) => [key, entry.trim()])
    ) as AddressFields;
    const nextErrors = validateAddress(trimmed);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    onSubmit({
      ...trimmed,
      id: value.id ?? newAddressId(),
      label: value.label ?? 'Shipping',
      line2: trimmed.line2 || undefined,
    });
  }

  // keep a country we don't list (e.g. from a saved address) selectable.
  const options = countries.some((country) => country.code === fields.country)
    ? countries
    : [...countries, { code: fields.country, name: fields.country }];

  return (
    <form className={styles.addressForm} onSubmit={handleSubmit} noValidate aria-label="Shipping address">
      <TextInput label="Full name" autoComplete="name" required {...field('name')} />
      <TextInput label="Street address" autoComplete="address-line1" required {...field('line1')} />
      <TextInput label="Apartment, suite, floor (optional)" autoComplete="address-line2" {...field('line2')} />
      <div className={styles.row}>
        <TextInput label="City" autoComplete="address-level2" required {...field('city')} />
        <TextInput label={isUS ? 'State' : 'Region'} autoComplete="address-level1" required {...field('region')} />
      </div>
      <div className={styles.row}>
        <TextInput
          label={isUS ? 'ZIP code' : 'Postal code'}
          autoComplete="postal-code"
          inputMode={isUS ? 'numeric' : undefined}
          required
          {...field('postalCode')}
        />
        <div className={styles.country}>
          <label htmlFor={countryId} className={styles.countryLabel}>
            Country
          </label>
          <select
            id={countryId}
            name="country"
            autoComplete="country"
            className={styles.select}
            value={fields.country}
            onChange={(event) => setFields((current) => ({ ...current, country: event.target.value }))}
          >
            {options.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" fullWidth>
        {submitLabel}
      </Button>
    </form>
  );
}
