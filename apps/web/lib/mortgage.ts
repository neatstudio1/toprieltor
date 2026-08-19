export interface MortgagePaymentInput {
  price: number;
  down: number;
  annualRate: number;
  termMonths: number;
}

/** Annuity monthly payment: PM = S × (P×(1+P)^n) / ((1+P)^n − 1) */
export function calcMonthlyPayment({
  price,
  down,
  annualRate,
  termMonths,
}: MortgagePaymentInput): number {
  const monthlyRate = annualRate / 12;
  const principal = Math.max(0, price - down);
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
}
