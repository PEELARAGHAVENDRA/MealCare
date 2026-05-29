class MealEntry {
  MealEntry({
    required this.date,
    required this.schoolId,
    required this.mealType,
    required this.menuItems,
    required this.quantityUsed,
    required this.preparedCount,
    required this.servedCount,
    required this.remainingAmount,
    required this.wastageAmount,
    required this.notes,
  });

  final DateTime date;
  final String schoolId;
  final String mealType;
  final List<String> menuItems;
  final double quantityUsed;
  final int preparedCount;
  final int servedCount;
  final double remainingAmount;
  final double wastageAmount;
  final String notes;

  Map<String, dynamic> toJson() => {
        'date': date.toIso8601String(),
        'schoolId': schoolId,
        'mealType': mealType,
        'menuItems': menuItems,
        'quantityUsed': quantityUsed,
        'preparedCount': preparedCount,
        'servedCount': servedCount,
        'remainingAmount': remainingAmount,
        'wastageAmount': wastageAmount,
        'notes': notes,
      };
}
