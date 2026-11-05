interface SaleLine {
  precioUnitario: number;
  cantidad: number;
}

/** Prices include IGV. Round each line as the sales API does, then add the lines. */
export function calculateSaleTotals(lines: readonly SaleLine[]) {
  let totalCents = 0;
  let subtotalCents = 0;
  for (const line of lines) {
    const lineCents = Math.round(line.precioUnitario * 100) * line.cantidad;
    totalCents += lineCents;
    subtotalCents += Math.round(lineCents * 100 / 118);
  }
  return {
    subtotal: subtotalCents / 100,
    igv: (totalCents - subtotalCents) / 100,
    total: totalCents / 100,
  };
}
