from .models import FoodItem

NUTRIENT_TARGETS = {
    "calories": 450,
    "protein": 12,
    "iron": 4,
    "calcium": 180,
    "vitaminA": 300,
    "vitaminC": 20,
    "fiber": 6,
}

SUGGESTIONS = {
    "protein": ["Egg", "Dal", "Groundnuts", "Milk"],
    "iron": ["Spinach", "Dal", "Groundnuts", "Beans"],
    "vitaminA": ["Carrot", "Spinach", "Vegetable Curry"],
    "calcium": ["Milk", "Spinach"],
    "fiber": ["Dal", "Beans", "Banana", "Vegetable Curry"],
}


def food_lookup(foods: list[FoodItem]) -> dict[str, FoodItem]:
    return {food.foodItem.lower(): food for food in foods}


def calculate_totals(menu_items: list[str], foods: list[FoodItem]) -> dict[str, float]:
    lookup = food_lookup(foods)
    totals = {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "iron": 0,
        "calcium": 0,
        "vitaminA": 0,
        "vitaminB": 0,
        "vitaminC": 0,
        "vitaminD": 0,
        "fiber": 0,
        "cost": 0,
    }

    for item in menu_items:
        food = lookup.get(item.lower())
        if not food:
            continue
        for key in totals.keys():
            if key == "cost":
                totals[key] += food.defaultCostPerServing
            else:
                totals[key] += getattr(food, key)

    return {key: round(value, 2) for key, value in totals.items()}


def score_totals(totals: dict[str, float]) -> float:
    scores = []
    for nutrient, target in NUTRIENT_TARGETS.items():
        scores.append(min(totals.get(nutrient, 0) / target, 1) * 100)
    return round(sum(scores) / len(scores), 2)


def detect_deficiencies(totals: dict[str, float]) -> list[dict]:
    deficiencies = []
    for nutrient, target in NUTRIENT_TARGETS.items():
        value = totals.get(nutrient, 0)
        if value >= target * 0.85:
            continue
        ratio = value / target if target else 1
        severity = "HIGH" if ratio < 0.5 else "MEDIUM" if ratio < 0.7 else "LOW"
        deficiencies.append({
            "nutrient": nutrient,
            "severity": severity,
            "message": f"{nutrient} is below the recommended target.",
            "current": round(value, 2),
            "target": target,
            "suggestedAdditions": SUGGESTIONS.get(nutrient, []),
        })
    return deficiencies


def analyze_menu(menu_items: list[str], foods: list[FoodItem]) -> dict:
    totals = calculate_totals(menu_items, foods)
    deficiencies = detect_deficiencies(totals)
    return {
        "menuItems": menu_items,
        "totals": totals,
        "dailyScore": score_totals(totals),
        "deficiencies": deficiencies,
        "recommendations": [
            f"Add {items[0]} to improve {deficiency['nutrient']}."
            for deficiency in deficiencies
            for items in [deficiency["suggestedAdditions"]]
            if items
        ],
    }


def generate_weekly_plan(student_count: int, budget_per_student: float, available_stock: dict[str, float], foods: list[FoodItem]) -> dict:
    candidate_menus = [
        ["Rice", "Dal", "Banana"],
        ["Rice", "Egg Curry"],
        ["Vegetable Pulao", "Milk"],
        ["Rice", "Spinach Dal"],
        ["Rice", "Sambar", "Carrot"],
        ["Lemon Rice", "Groundnuts", "Banana"],
        ["Rice", "Vegetable Curry", "Milk"],
        ["Rice", "Beans", "Tomato"],
    ]

    budget_limit = student_count * budget_per_student
    scored = []
    for menu in candidate_menus:
        analysis = analyze_menu(menu, foods)
        cost = analysis["totals"]["cost"] * student_count
        stock_penalty = 0
        for item in menu:
            if available_stock and available_stock.get(item, student_count) < student_count:
                stock_penalty += 10
        budget_penalty = max(0, (cost - budget_limit) / max(budget_limit, 1) * 20)
        scored.append((analysis["dailyScore"] - stock_penalty - budget_penalty, menu, analysis, cost))

    scored.sort(key=lambda row: row[0], reverse=True)
    selected = []
    used_signatures = set()
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    index = 0

    while len(selected) < 7:
        _, menu, analysis, cost = scored[index % len(scored)]
        signature = "|".join(menu)
        if signature not in used_signatures or len(used_signatures) == len(scored):
            used_signatures.add(signature)
            selected.append({
                "dayOfWeek": day_names[len(selected)],
                "menuItems": menu,
                "calories": analysis["totals"]["calories"],
                "protein": analysis["totals"]["protein"],
                "vitaminScore": round((min(analysis["totals"]["vitaminA"] / 300, 1) + min(analysis["totals"]["vitaminC"] / 20, 1)) * 50, 2),
                "costEstimate": round(cost, 2),
                "nutritionScore": analysis["dailyScore"],
                "deficiencies": analysis["deficiencies"],
            })
        index += 1

    total_cost = round(sum(day["costEstimate"] for day in selected), 2)
    weekly_score = round(sum(day["nutritionScore"] for day in selected) / len(selected), 2)
    return {"days": selected, "totalCostEstimate": total_cost, "weeklyScore": weekly_score}
