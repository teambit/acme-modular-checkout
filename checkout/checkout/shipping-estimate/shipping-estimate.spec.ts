import { shippingEstimate } from './shipping-estimate.js';

it('estimates shipping for 2kg over 150km', () => {
  expect(shippingEstimate(2, 150)).toEqual(6.6);
});
