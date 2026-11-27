const dashboardKey = "dashboard";

export function useDashboard() {
  return useFetch("/api/dashboard", { key: dashboardKey });
}

export function refreshDashboard() {
  return refreshNuxtData(dashboardKey);
}
