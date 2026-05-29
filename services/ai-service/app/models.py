from pydantic import BaseModel, Field


class FoodItem(BaseModel):
    foodItem: str
    category: str
    calories: float
    protein: float
    carbs: float
    fat: float
    iron: float
    calcium: float
    vitaminA: float
    vitaminB: float
    vitaminC: float
    vitaminD: float
    fiber: float
    defaultCostPerServing: float = 0


class AnalyzeMenuRequest(BaseModel):
    menuItems: list[str]
    foods: list[FoodItem]


class PlannerRequest(BaseModel):
    studentCount: int = Field(gt=0)
    budgetPerStudent: float = Field(gt=0)
    availableStock: dict[str, float] = {}
    nutritionGoal: str = "balanced"
    foods: list[FoodItem]
