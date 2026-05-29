export function calculateWastePercentage(preparedQuantity: number, leftoverQuantity: number) {
  if (preparedQuantity <= 0) {
    return 0;
  }

  return Number(((leftoverQuantity / preparedQuantity) * 100).toFixed(2));
}
