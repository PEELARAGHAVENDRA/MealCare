import { AppShell } from "@/components/app-shell";

const reports = [
  ["Weekly nutrition summary", "Nutrition Officer", "This week", "Ready"],
  ["Food wastage audit", "School Head", "May 2026", "Ready"],
  ["District comparison", "District Admin", "May 2026", "Draft"]
];

export default function ReportsPage() {
  return (
    <AppShell title="Reports" subtitle="Approvals and exports">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Generated Reports</h2>
        <div className="mt-4 grid gap-3">
          {reports.map(([title, owner, period, status]) => (
            <article key={title} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">{title}</h3>
                  <p className="text-sm text-slate-500">{owner} - {period}</p>
                </div>
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
