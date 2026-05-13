import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../api/axios";
import KpiCard from "../components/KpiCard";
import WidgetChart from "../components/WidgetChart";

function PublicDashboard() {
  const { dashboardId } = useParams();

  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicDashboard();
  }, [dashboardId]);

  const fetchPublicDashboard = async () => {
    try {
      const dashboardRes = await api.get(`dashboards/${dashboardId}/`);
      const analyticsRes = await api.get(
        `dashboards/analytics/${dashboardId}/`
      );

      if (dashboardRes.data.access_type !== "public") {
        setDashboard(null);
        setAnalytics([]);
        return;
      }

      setDashboard(dashboardRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.log(error.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h3 className="p-4">Loading public dashboard...</h3>;
  }

  if (!dashboard) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          This dashboard is not public or does not exist.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <div className="container py-4">
        <div className="mb-4">
          <h2>{dashboard.name}</h2>
          <p className="text-muted">{dashboard.description}</p>
          <span className="badge bg-success">Public Read-only Dashboard</span>
        </div>

        <div className="row g-4">
          {analytics.map((widget, index) => {
            const chartData = [
              {
                name: widget.widget,
                value: widget.total_value,
              },
            ];

            if (widget.type === "kpi") {
              return (
                <div className="col-md-4" key={index}>
                  <KpiCard title={widget.widget} value={widget.total_value} />
                </div>
              );
            }

            if (widget.type === "table") {
              return (
                <div className="col-lg-6" key={index}>
                  <div className="card shadow-sm border-0">
                    <div className="card-body">
                      <h5>{widget.widget}</h5>

                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <th>Total Events</th>
                            <td>{widget.total_events}</td>
                          </tr>

                          <tr>
                            <th>Total Value</th>
                            <td>{widget.total_value}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="col-lg-6" key={index}>
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h5>{widget.widget}</h5>
                    <WidgetChart type={widget.type} data={chartData} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {analytics.length === 0 && (
          <div className="alert alert-info mt-4">
            No public dashboard widgets found.
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicDashboard;