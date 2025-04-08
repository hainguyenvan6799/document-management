import { CurrencyMoneyPipe } from './currency-money.pipe';

describe('CurrencyMoneyPipe', () => {
  it('create an instance', () => {
    const pipe = new CurrencyMoneyPipe();
    expect(pipe).toBeTruthy();
  });
});
