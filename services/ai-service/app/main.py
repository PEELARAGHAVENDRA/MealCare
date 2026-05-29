from fastapi import FastAPI
from .models import AnalyzeMenuRequest, PlannerRequest
from .nutrition import analyze_menu, calculate_totals, detect_deficiencies, generate_weekly_plan

app = FastAPI(title="Mid-Day Meal AI Nutrition Service", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze-menu")
def analyze(request: AnalyzeMenuRequest):
    return analyze_menu(request.menuItems, request.foods)


@app.post("/detect-deficiencies")
def deficiencies(request: AnalyzeMenuRequest):
    totals = calculate_totals(request.menuItems, request.foods)
    return {"totals": totals, "deficiencies": detect_deficiencies(totals)}


@app.post("/generate-weekly-plan")
def weekly_plan(request: PlannerRequest):
    return generate_weekly_plan(
        student_count=request.studentCount,
        budget_per_student=request.budgetPerStudent,
        available_stock=request.availableStock,
        foods=request.foods,
    )
