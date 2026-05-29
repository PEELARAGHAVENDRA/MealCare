export type DashboardData = {
  school: { name: string; studentCount: number } | null;
  prepared: number;
  served: number;
  remaining: number;
};

// Static fallbacks in case of network issues or missing context
export const demoDashboard: DashboardData = {
  school: { name: "Government Primary School Nandipur", studentCount: 240 },
  prepared: 230,
  served: 218,
  remaining: 12
};

export const attendanceTrend = [
  { date: "Mon", percentage: 94 },
  { date: "Tue", percentage: 91 },
  { date: "Wed", percentage: 96 },
  { date: "Thu", percentage: 93 },
  { date: "Fri", percentage: 97 }
];

export const wasteTrend = [
  { date: "Mon", waste: 6 },
  { date: "Tue", waste: 4 },
  { date: "Wed", waste: 8 },
  { date: "Thu", waste: 5 },
  { date: "Fri", waste: 3 }
];

export const nutritionTrend = [
  { date: "Mon", score: 78 },
  { date: "Tue", score: 84 },
  { date: "Wed", score: 81 },
  { date: "Thu", score: 88 },
  { date: "Fri", score: 86 }
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getHeaders() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

export async function fetchTodayStats(schoolId: string): Promise<DashboardData> {
  try {
    const res = await fetch(`${API_BASE_URL}/schools/${schoolId}/dashboard/today`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch today's stats");
    const data = await res.json();
    return {
      school: data.school ? { name: data.school.name, studentCount: data.school.studentCount } : null,
      prepared: data.prepared || 0,
      served: data.served || 0,
      remaining: data.remaining || 0
    };
  } catch (error) {
    console.warn("API today stats error, using mock fallback:", error);
    return demoDashboard;
  }
}

export interface AnalyticsResponse {
  totalPrepared: number;
  totalServed: number;
  averageWaste: number;
  mealParticipation: { date: string; percentage: number }[];
  meals: any[];
  wastage: any[];
  recommendations: any[];
}

export async function fetchSchoolAnalytics(schoolId: string): Promise<AnalyticsResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/school/${schoolId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch school analytics");
    const data = await res.json();
    return {
      totalPrepared: data.totalPrepared || 0,
      totalServed: data.totalServed || 0,
      averageWaste: data.averageWaste || 0,
      mealParticipation: (data.mealParticipation || []).map((p: any) => ({
        date: new Date(p.date).toLocaleDateString("en-US", { weekday: "short" }),
        percentage: Math.round(p.percentage)
      })),
      meals: data.meals || [],
      wastage: data.wastage || [],
      recommendations: data.recommendations || []
    };
  } catch (error) {
    console.warn("API school analytics error, returning default format:", error);
    return {
      totalPrepared: 230,
      totalServed: 218,
      averageWaste: 5.22,
      mealParticipation: attendanceTrend,
      meals: [],
      wastage: [],
      recommendations: []
    };
  }
}

export async function fetchDistrictAnalytics() {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics/district`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch district analytics");
    return await res.json();
  } catch (error) {
    console.warn("API district analytics error, returning mock data:", error);
    return {
      schools: [
        { id: "1", name: "Government Primary School Nandipur", district: "Demo District", prepared: 230, served: 218, averageWaste: 5.22 },
        { id: "2", name: "Zilla Parishad School East", district: "Demo District", prepared: 310, served: 288, averageWaste: 7.1 },
        { id: "3", name: "Model Primary School West", district: "Demo District", prepared: 180, served: 174, averageWaste: 3.4 }
      ]
    };
  }
}

export async function fetchMealsList(schoolId?: string) {
  try {
    const url = schoolId ? `${API_BASE_URL}/meals?schoolId=${schoolId}` : `${API_BASE_URL}/meals`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to fetch meals");
    return await res.json();
  } catch (error) {
    console.warn("API fetch meals error, returning mock data:", error);
    return [];
  }
}

export async function createSchool(schoolData: {
  name: string;
  code: string;
  district: string;
  block: string;
  address: string;
  studentCount: number;
  type?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/schools`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(schoolData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create school");
  }
  return await res.json();
}

