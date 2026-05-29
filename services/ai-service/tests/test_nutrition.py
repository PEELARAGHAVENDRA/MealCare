from app.models import FoodItem
from app.nutrition import analyze_menu, generate_weekly_plan


FOODS = [
    FoodItem(foodItem="Rice", category="Grain", calories=130, protein=2, carbs=28, fat=0, iron=1, calcium=10, vitaminA=0, vitaminB=0, vitaminC=0, vitaminD=0, fiber=0, defaultCostPerServing=4),
    FoodItem(foodItem="Dal", category="Pulse", calories=116, protein=9, carbs=20, fat=0, iron=3, calcium=19, vitaminA=0, vitaminB=0, vitaminC=1, vitaminD=0, fiber=8, defaultCostPerServing=8),
    FoodItem(foodItem="Spinach Dal", category="Prepared", calories=160, protein=10, carbs=24, fat=3, iron=5, calcium=100, vitaminA=430, vitaminB=0, vitaminC=24, vitaminD=0, fiber=8, defaultCostPerServing=11),
    FoodItem(foodItem="Milk", category="Dairy", calories=61, protein=3, carbs=5, fat=3, iron=0, calcium=113, vitaminA=46, vitaminB=0, vitaminC=0, vitaminD=1, fiber=0, defaultCostPerServing=10),
]


def test_analyze_menu_scores_and_deficiencies():
    result = analyze_menu(["Rice", "Dal"], FOODS)
    assert result["dailyScore"] > 0
    assert "totals" in result
    assert isinstance(result["deficiencies"], list)


def test_weekly_plan_has_seven_days():
    result = generate_weekly_plan(100, 20, {}, FOODS)
    assert len(result["days"]) == 7
    assert result["weeklyScore"] > 0
