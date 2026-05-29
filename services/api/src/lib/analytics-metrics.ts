export function calculateMealParticipation(presentStudents: number, mealParticipants: number) {
  if (presentStudents <= 0) {
    return 0;
  }

  return Number(((mealParticipants / presentStudents) * 100).toFixed(2));
}

export function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}
