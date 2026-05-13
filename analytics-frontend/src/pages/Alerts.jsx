import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    dashboard: "",
    metric_name: "",
    threshold_value: "",
    condition: "gt",
    duration_minutes: 10,
    email: "",
    webhook_url: "",
  });

  useEffect(() => {
    fetchAlertsPageData();
  }, []);

  const fetchAlertsPageData = async () => {
    try {
      const [alertsRes, historyRes, notificationsRes, dashboardsRes] =
        await Promise.all([
          api.get("alerts/list/"),
          api.get("alerts/history/"),
          api.get("alerts/notifications/"),
          api.get("dashboards/list/"),
        ]);

      setAlerts(alertsRes.data);
      setHistory(historyRes.data);
      setNotifications(notificationsRes.data);
      setDashboards(dashboardsRes.data);

      if (dashboardsRes.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          dashboard: dashboardsRes.data[0].id,
        }));
      }
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to load alerts data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();

    try {
      await api.post("alerts/create/", {
        ...formData,
        dashboard: Number(formData.dashboard),
        threshold_value: Number(formData.threshold_value),
        duration_minutes: Number(formData.duration_minutes),
        email: formData.email || null,
        webhook_url: formData.webhook_url || null,
      });

      toast.success("Alert rule created successfully");

      setFormData({
        dashboard: dashboards[0]?.id || "",
        metric_name: "",
        threshold_value: "",
        condition: "gt",
        duration_minutes: 10,
        email: "",
        webhook_url: "",
      });

      fetchAlertsPageData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to create alert");
    }
  };

  const handleMute = async (alertId) => {
    try {
      await api.post(`alerts/mute/${alertId}/`);
      toast.success("Alert muted");
      fetchAlertsPageData();
    } catch (error) {
      toast.error("Failed to mute alert");
    }
  };

  const handleSnooze = async (alertId) => {
    try {
      await api.post(`alerts/snooze/${alertId}/`);
      toast.success("Alert snoozed for 30 minutes");
      fetchAlertsPageData();
    } catch (error) {
      toast.error("Failed to snooze alert");
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await api.post(`alerts/notifications/read/${notificationId}/`);
      toast.success("Notification marked as read");
      fetchAlertsPageData();
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  if (loading) {
    return <h3 className="p-4">Loading alerts...</h3>;
  }

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="container-fluid p-4">
          <h3 className="mb-4">Alerts & Notifications</h3>

          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Create Alert Rule</h5>

                  <form onSubmit={handleCreateAlert}>
                    <div className="mb-3">
                      <label className="form-label">Dashboard</label>
                      <select
                        name="dashboard"
                        className="form-select"
                        value={formData.dashboard}
                        onChange={handleChange}
                        required
                      >
                        {dashboards.map((dashboard) => (
                          <option key={dashboard.id} value={dashboard.id}>
                            {dashboard.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Metric Name</label>
                      <input
                        type="text"
                        name="metric_name"
                        className="form-control"
                        value={formData.metric_name}
                        onChange={handleChange}
                        placeholder="Example: error_rate"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Condition</label>
                      <select
                        name="condition"
                        className="form-select"
                        value={formData.condition}
                        onChange={handleChange}
                      >
                        <option value="gt">Greater Than</option>
                        <option value="lt">Less Than</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Threshold Value</label>
                      <input
                        type="number"
                        name="threshold_value"
                        className="form-control"
                        value={formData.threshold_value}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Duration Minutes</label>
                      <input
                        type="number"
                        name="duration_minutes"
                        className="form-control"
                        value={formData.duration_minutes}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Email Notification</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="optional"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Webhook URL</label>
                      <input
                        type="url"
                        name="webhook_url"
                        className="form-control"
                        value={formData.webhook_url}
                        onChange={handleChange}
                        placeholder="optional"
                      />
                    </div>

                    <button className="btn btn-primary w-100">
                      Create Alert
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h5 className="mb-3">Alert Rules</h5>

                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Condition</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {alerts.map((alert) => (
                        <tr key={alert.id}>
                          <td>{alert.metric_name}</td>
                          <td>
                            {alert.condition} {alert.threshold_value}
                          </td>
                          <td>{alert.status}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => handleMute(alert.id)}
                            >
                              Mute
                            </button>

                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleSnooze(alert.id)}
                            >
                              Snooze
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {alerts.length === 0 && (
                    <p className="text-muted">No alert rules found.</p>
                  )}
                </div>
              </div>

              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h5 className="mb-3">In-App Notifications</h5>

                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {notifications.map((notification) => (
                        <tr key={notification.id}>
                          <td>{notification.title}</td>
                          <td>{notification.message}</td>
                          <td>
                            {notification.is_read ? "Read" : "Unread"}
                          </td>
                          <td>
                            {!notification.is_read && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => handleMarkRead(notification.id)}
                              >
                                Mark Read
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {notifications.length === 0 && (
                    <p className="text-muted">No notifications found.</p>
                  )}
                </div>
              </div>

              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Alert History</h5>

                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>Message</th>
                        <th>Triggered Value</th>
                        <th>Triggered At</th>
                      </tr>
                    </thead>

                    <tbody>
                      {history.map((item) => (
                        <tr key={item.id}>
                          <td>{item.message}</td>
                          <td>{item.triggered_value}</td>
                          <td>
                            {new Date(item.triggered_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {history.length === 0 && (
                    <p className="text-muted">No alert history found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alerts;