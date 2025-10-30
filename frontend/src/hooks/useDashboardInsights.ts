import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";

export type DashboardMetric = {
  Label: string;
  Value: number | string;
  Trend: string;
};

export type DashboardResponse = {
  Company: string;
  Summary: string;
  Metrics: DashboardMetric[];
  Updates: string[];
};

type StatusState = { type: "error" | "info"; message: string } | null;

export const useDashboardInsights = () => {
  const { refreshUser } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [status, setStatus] = useState<StatusState>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await API.get<DashboardResponse>("/dashboard/insights");
      setData(response.data);
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const code = error.response?.status;
        if (code === 403) {
          setStatus({
            type: "info",
            message: "Your subscription is inactive. Upgrade your plan to access live insights."
          });
          await refreshUser();
        } else if (code === 401) {
          setStatus({
            type: "error",
            message: "Your session expired. Please log in again."
          });
        } else {
          const message =
            error.response?.data && typeof error.response.data === "object" && "message" in error.response.data
              ? String((error.response.data as { message?: string }).message)
              : "We could not load your workspace data right now.";
          setStatus({ type: "error", message });
        }
      } else {
        setStatus({ type: "error", message: "Unexpected error while fetching data." });
      }
    } finally {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  return { data, status, loading, reload: loadInsights };
};
