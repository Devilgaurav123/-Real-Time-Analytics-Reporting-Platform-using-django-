import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import GridLayout from "react-grid-layout";

import {
  getDashboards,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getDashboardAnalytics,
  createWidget,
  updateWidget,
  deleteWidget,
  getTemplates,
} from "../api/dashboardApi";

import { getEvents } from "../api/ingestionApi";
import { getAlerts, getNotifications } from "../api/alertsApi";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import KpiCard from "../components/KpiCard";
import WidgetChart from "../components/WidgetChart";

function Dashboard() {
  const userRole = localStorage.getItem("role") || "admin";

  const canManageDashboard = ["owner", "admin"].includes(userRole);
  const canManageWidget = ["owner", "admin", "analyst"].includes(userRole);
  const isViewer = userRole === "viewer";

  const [dashboards, setDashboards] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);

  const [analytics, setAnalytics] = useState([]);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [liveEvents, setLiveEvents] = useState([]);
  const [socketStatus, setSocketStatus] = useState("Disconnected");

  const [loading, setLoading] = useState(true);
  const [editingDashboard, setEditingDashboard] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [drilldownData, setDrilldownData] = useState(null);

  const [dateRange, setDateRange] = useState("7days");
  const [customFilter, setCustomFilter] = useState("");
  const [chartTypeFilter, setChartTypeFilter] = useState("all");

  const dashboardSocketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const manualCloseRef = useRef(false);
  const shownAlertIdsRef = useRef(new Set());

  const [dashboardForm, setDashboardForm] = useState({
    name: "",
    description: "",
    access_type: "private",
    auto_refresh_interval: "30s",
    is_fullscreen_enabled: false,
  });

  const [editDashboardForm, setEditDashboardForm] = useState({
    name: "",
    description: "",
    access_type: "private",
    auto_refresh_interval: "30s",
    is_fullscreen_enabled: false,
  });

  const [widgetForm, setWidgetForm] = useState({
    dashboard: "",
    widget_type: "line",
    title: "",
    event_name: "",
    time_range: "7days",
    position_x: 0,
    position_y: 0,
    width: 6,
    height: 4,
  });

  const [editWidgetForm, setEditWidgetForm] = useState({
    title: "",
    widget_type: "line",
    event_name: "",
    time_range: "7days",
  });

  const getWebSocketUrl = useCallback((dashboardId) => {
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000";
    return `${baseUrl}/ws/dashboard/${dashboardId}/`;
  }, []);

  const fetchAnalytics = useCallback(
    async (dashboardId) => {
      try {
        const response = await getDashboardAnalytics(dashboardId, {
          date_range: dateRange,
          search: customFilter,
          chart_type: chartTypeFilter !== "all" ? chartTypeFilter : "",
        });

        setAnalytics(response.data);
      } catch (error) {
        console.log("Analytics fetch error:", error.response?.data || error);
        setAnalytics([]);
      }
    },
    [dateRange, customFilter, chartTypeFilter]
  );

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashboardRes, eventsRes, alertsRes, notificationRes] =
        await Promise.all([
          getDashboards(),
          getEvents(),
          getAlerts(),
          getNotifications(),
        ]);

      setDashboards(dashboardRes.data);
      setEvents(eventsRes.data);
      setAlerts(alertsRes.data);
      setNotifications(notificationRes.data);

      if (dashboardRes.data.length > 0) {
        setSelectedDashboard((prev) => {
          if (!prev) return dashboardRes.data[0];

          const existingDashboard = dashboardRes.data.find(
            (dashboard) => dashboard.id === prev.id
          );

          return existingDashboard || dashboardRes.data[0];
        });

        setWidgetForm((prev) => ({
          ...prev,
          dashboard: prev.dashboard || dashboardRes.data[0].id,
        }));
      } else {
        setSelectedDashboard(null);
        setAnalytics([]);
      }
    } catch (error) {
      console.log("Dashboard fetch error:", error.response?.data || error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await getTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.log("Templates fetch error:", error.response?.data || error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchTemplates();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (selectedDashboard?.id) {
      fetchAnalytics(selectedDashboard.id);
    }
  }, [selectedDashboard?.id, fetchAnalytics]);

  const handleRealtimeMessage = useCallback(
    (message) => {
      const messageType = message.type || message.event || message.action;

      if (
        messageType === "dashboard_update" ||
        messageType === "widget_update" ||
        messageType === "analytics_update"
      ) {
        if (selectedDashboard?.id) fetchAnalytics(selectedDashboard.id);
        fetchDashboardData();
      }

      if (
        messageType === "new_event" ||
        messageType === "event_created" ||
        messageType === "live_event"
      ) {
        const eventData = message.data || message.event_data || message;

        setLiveEvents((prev) => [eventData, ...prev].slice(0, 20));
        setEvents((prev) => [eventData, ...prev].slice(0, 100));

        if (selectedDashboard?.id) fetchAnalytics(selectedDashboard.id);

        toast.info(`Live Event: ${eventData.event_name || "New event"}`);
      }

      if (
        messageType === "alert_triggered" ||
        messageType === "new_alert" ||
        messageType === "alert_notification"
      ) {
        const alertData = message.data || message.alert || message;

        const alertId =
          alertData.id ||
          alertData.alert_id ||
          `${alertData.metric_name}-${alertData.triggered_value}-${Date.now()}`;

        if (!shownAlertIdsRef.current.has(alertId)) {
          shownAlertIdsRef.current.add(alertId);

          toast.warning(
            `Alert: ${alertData.metric_name || "Metric"} ${
              alertData.condition || ""
            } ${alertData.threshold_value || ""}`,
            {
              position: "top-right",
              autoClose: 6000,
            }
          );
        }

        setAlerts((prev) => {
          const exists = prev.some((item) => item.id === alertData.id);

          if (exists) {
            return prev.map((item) =>
              item.id === alertData.id ? { ...item, ...alertData } : item
            );
          }

          return [alertData, ...prev];
        });

        setNotifications((prev) => [alertData, ...prev]);
      }
    },
    [fetchAnalytics, fetchDashboardData, selectedDashboard?.id]
  );

  const connectDashboardSocket = useCallback(() => {
    if (!selectedDashboard?.id) return;

    manualCloseRef.current = false;
    setSocketStatus("Connecting...");

    const socket = new WebSocket(getWebSocketUrl(selectedDashboard.id));
    dashboardSocketRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptRef.current = 0;
      setSocketStatus("Connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleRealtimeMessage(message);
      } catch (error) {
        console.log("Invalid realtime message:", event.data);
      }
    };

    socket.onerror = (error) => {
      console.log("Dashboard socket error:", error);
      setSocketStatus("Connection Error");
    };

    socket.onclose = () => {
      setSocketStatus("Disconnected");

      if (manualCloseRef.current) return;

      reconnectAttemptRef.current += 1;

      const reconnectDelay = Math.min(
        1000 * 2 ** reconnectAttemptRef.current,
        30000
      );

      setSocketStatus(`Reconnecting in ${Math.ceil(reconnectDelay / 1000)}s`);

      reconnectTimerRef.current = setTimeout(() => {
        connectDashboardSocket();
      }, reconnectDelay);
    };
  }, [getWebSocketUrl, handleRealtimeMessage, selectedDashboard?.id]);

  useEffect(() => {
    if (!selectedDashboard?.id) return;

    connectDashboardSocket();

    return () => {
      manualCloseRef.current = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (dashboardSocketRef.current) {
        dashboardSocketRef.current.close();
      }
    };
  }, [selectedDashboard?.id, connectDashboardSocket]);

  const handleManualReconnect = () => {
    if (!selectedDashboard?.id) {
      toast.error("Please select dashboard first");
      return;
    }

    manualCloseRef.current = true;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }

    if (dashboardSocketRef.current) {
      dashboardSocketRef.current.close();
    }

    reconnectAttemptRef.current = 0;
    manualCloseRef.current = false;
    connectDashboardSocket();
  };

  const handleDashboardChange = (e) => {
    const { name, value, type, checked } = e.target;

    setDashboardForm({
      ...dashboardForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEditDashboardChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditDashboardForm({
      ...editDashboardForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCreateDashboard = async (e) => {
    e.preventDefault();

    if (!canManageDashboard) {
      toast.error("You do not have permission to create dashboard");
      return;
    }

    try {
      await createDashboard(dashboardForm);

      toast.success("Dashboard created successfully");

      setDashboardForm({
        name: "",
        description: "",
        access_type: "private",
        auto_refresh_interval: "30s",
        is_fullscreen_enabled: false,
      });

      fetchDashboardData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to create dashboard");
    }
  };

  const openEditDashboard = () => {
    if (!canManageDashboard) {
      toast.error("Only owner/admin can edit dashboard");
      return;
    }

    if (!selectedDashboard) {
      toast.error("Select dashboard first");
      return;
    }

    setEditDashboardForm({
      name: selectedDashboard.name || "",
      description: selectedDashboard.description || "",
      access_type: selectedDashboard.access_type || "private",
      auto_refresh_interval: selectedDashboard.auto_refresh_interval || "30s",
      is_fullscreen_enabled: selectedDashboard.is_fullscreen_enabled || false,
    });

    setEditingDashboard(true);
  };

  const handleUpdateDashboard = async (e) => {
    e.preventDefault();

    if (!canManageDashboard) {
      toast.error("You do not have permission to update dashboard");
      return;
    }

    try {
      await updateDashboard(selectedDashboard.id, editDashboardForm);

      toast.success("Dashboard updated successfully");
      setEditingDashboard(false);
      fetchDashboardData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to update dashboard");
    }
  };

  const handleCreateFromTemplate = async (template) => {
    if (!canManageDashboard) {
      toast.error("Only owner/admin can create dashboard from template");
      return;
    }

    try {
      await createDashboard({
        name: `${template.name} Dashboard`,
        description: template.description,
        access_type: "private",
        auto_refresh_interval: "30s",
        is_fullscreen_enabled: false,
      });

      toast.success("Dashboard created from template");
      fetchDashboardData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to create dashboard from template");
    }
  };

  const handleDeleteDashboard = async () => {
    if (!canManageDashboard) {
      toast.error("Only owner/admin can delete dashboard");
      return;
    }

    if (!selectedDashboard) {
      toast.error("Please select dashboard first");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedDashboard.name}?`
    );

    if (!confirmDelete) return;

    try {
      await deleteDashboard(selectedDashboard.id);

      toast.success("Dashboard deleted successfully");
      setSelectedDashboard(null);
      fetchDashboardData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to delete dashboard");
    }
  };

  const handleWidgetChange = (e) => {
    setWidgetForm({
      ...widgetForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditWidgetChange = (e) => {
    setEditWidgetForm({
      ...editWidgetForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddWidget = async (e) => {
    e.preventDefault();

    if (!canManageWidget) {
      toast.error("You do not have permission to add widget");
      return;
    }

    if (!selectedDashboard) {
      toast.error("Create or select dashboard first");
      return;
    }

    try {
      await createWidget({
        ...widgetForm,
        dashboard: selectedDashboard.id,
        position_x: Number(widgetForm.position_x),
        position_y: Number(widgetForm.position_y),
        width: Number(widgetForm.width),
        height: Number(widgetForm.height),
      });

      toast.success("Widget added successfully");

      setWidgetForm({
        dashboard: selectedDashboard.id,
        widget_type: "line",
        title: "",
        event_name: "",
        time_range: "7days",
        position_x: 0,
        position_y: 0,
        width: 6,
        height: 4,
      });

      fetchAnalytics(selectedDashboard.id);
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to add widget");
    }
  };

  const openEditWidget = (widget) => {
    if (!canManageWidget) {
      toast.error("You do not have permission to edit widget");
      return;
    }

    setEditingWidget(widget);

    setEditWidgetForm({
      title: widget.widget || "",
      widget_type: widget.type || "line",
      event_name: widget.event_name || "",
      time_range: widget.time_range || "7days",
    });
  };

  const handleUpdateWidget = async (e) => {
    e.preventDefault();

    if (!canManageWidget) {
      toast.error("You do not have permission to update widget");
      return;
    }

    if (!editingWidget) return;

    try {
      await updateWidget(editingWidget.widget_id, {
        title: editWidgetForm.title,
        widget_type: editWidgetForm.widget_type,
        event_name: editWidgetForm.event_name,
        time_range: editWidgetForm.time_range,
      });

      toast.success("Widget updated successfully");
      setEditingWidget(null);
      fetchAnalytics(selectedDashboard.id);
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to update widget");
    }
  };

  const handleDeleteWidget = async (widgetId) => {
    if (!canManageWidget) {
      toast.error("You do not have permission to delete widget");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this widget?"
    );

    if (!confirmDelete) return;

    try {
      await deleteWidget(widgetId);

      toast.success("Widget deleted successfully");
      fetchAnalytics(selectedDashboard.id);
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to delete widget");
    }
  };

  const handleLayoutChange = async (layout) => {
    if (!canManageWidget) return;

    try {
      for (const item of layout) {
        await updateWidget(item.i, {
          position_x: item.x,
          position_y: item.y,
          width: item.w,
          height: item.h,
        });
      }
    } catch (error) {
      console.log("Layout save error:", error.response?.data || error);
    }
  };

  const handleSelectDashboard = (dashboardId) => {
    const dashboard = dashboards.find((item) => item.id === Number(dashboardId));
    setSelectedDashboard(dashboard || null);

    setWidgetForm((prev) => ({
      ...prev,
      dashboard: Number(dashboardId),
    }));
  };

  const handleCopyShareLink = () => {
    if (!selectedDashboard) {
      toast.error("Select dashboard first");
      return;
    }

    const shareUrl = `${window.location.origin}/public-dashboard/${selectedDashboard.id}`;
    navigator.clipboard.writeText(shareUrl);

    toast.success("Dashboard share link copied");
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportWidget = (widget) => {
    const exportData = JSON.stringify(widget, null, 2);
    const blob = new Blob([exportData], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${widget.widget || "chart"}-analytics.json`;
    link.click();

    URL.revokeObjectURL(url);
    toast.success("Chart data exported");
  };

  const filteredAnalytics = analytics.filter((item) => {
    const matchSearch =
      !customFilter ||
      item.widget?.toLowerCase().includes(customFilter.toLowerCase()) ||
      item.event_name?.toLowerCase().includes(customFilter.toLowerCase());

    const matchType = chartTypeFilter === "all" || item.type === chartTypeFilter;

    return matchSearch && matchType;
  });

  const unreadNotifications = notifications.filter((item) => !item.is_read).length;

  const totalWidgetEvents = filteredAnalytics.reduce(
    (acc, item) => acc + Number(item.total_events || 0),
    0
  );

  const totalAnalyticsValue = filteredAnalytics.reduce(
    (acc, item) => acc + Number(item.total_value || 0),
    0
  );

  const gridLayout = filteredAnalytics
    .filter((item) => item.widget_id)
    .map((item, index) => ({
      i: String(item.widget_id),
      x: Number(item.position_x ?? 0),
      y: Number(item.position_y ?? index * 4),
      w: Number(item.width ?? 6),
      h: Number(item.height ?? 4),
      minW: 3,
      minH: 3,
    }));

  if (loading) {
    return <h3 className="p-4">Loading dashboard...</h3>;
  }

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="mb-1">Advanced Analytics Dashboard</h3>

              <p className="text-muted mb-0">
                Role: <strong>{userRole}</strong> | Access:{" "}
                <strong>{selectedDashboard?.access_type || "N/A"}</strong>
              </p>

              <div className="mt-2">
                <span
                  className={`badge ${
                    socketStatus === "Connected"
                      ? "bg-success"
                      : socketStatus === "Connecting..."
                      ? "bg-warning text-dark"
                      : "bg-danger"
                  }`}
                >
                  WebSocket: {socketStatus}
                </span>

                <button
                  className="btn btn-sm btn-outline-primary ms-2"
                  onClick={handleManualReconnect}
                >
                  Reconnect
                </button>
              </div>
            </div>

            <div className="d-flex gap-2">
              <select
                className="form-select"
                style={{ width: "260px" }}
                value={selectedDashboard?.id || ""}
                onChange={(e) => handleSelectDashboard(e.target.value)}
              >
                <option value="">Select Dashboard</option>

                {dashboards.map((dashboard) => (
                  <option key={dashboard.id} value={dashboard.id}>
                    {dashboard.name}
                  </option>
                ))}
              </select>

              <button
                className="btn btn-primary"
                onClick={openEditDashboard}
                disabled={!canManageDashboard}
              >
                Edit
              </button>

              <button className="btn btn-success" onClick={handleCopyShareLink}>
                Share
              </button>

              <button className="btn btn-dark" onClick={handleFullscreen}>
                Fullscreen
              </button>

              <button
                className="btn btn-danger"
                onClick={handleDeleteDashboard}
                disabled={!canManageDashboard}
              >
                Delete
              </button>
            </div>
          </div>

          {selectedDashboard?.access_type === "public" && (
            <div className="alert alert-success">
              This dashboard is public and can be shared as read-only.
            </div>
          )}

          {selectedDashboard?.access_type === "team" && (
            <div className="alert alert-info">
              This dashboard is team-only. Only team members can access it.
            </div>
          )}

          {isViewer && (
            <div className="alert alert-warning">
              You are logged in as Viewer. Create, edit, delete and drag actions are disabled.
            </div>
          )}

          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <KpiCard title="Dashboards" value={dashboards.length} />
            </div>

            <div className="col-md-3">
              <KpiCard title="Total Events" value={events.length} />
            </div>

            <div className="col-md-3">
              <KpiCard title="Active Alerts" value={alerts.length} />
            </div>

            <div className="col-md-3">
              <KpiCard title="Unread Notifications" value={unreadNotifications} />
            </div>
          </div>

          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h5 className="mb-3">Advanced Filters</h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Date Range</label>
                  <select
                    className="form-select"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="24hours">Last 24 Hours</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Custom Filter</label>
                  <input
                    className="form-control"
                    placeholder="Search by widget or event"
                    value={customFilter}
                    onChange={(e) => setCustomFilter(e.target.value)}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Chart Type</label>
                  <select
                    className="form-select"
                    value={chartTypeFilter}
                    onChange={(e) => setChartTypeFilter(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                    <option value="pie">Pie</option>
                    <option value="kpi">KPI</option>
                    <option value="table">Table</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {editingDashboard && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h5 className="mb-3">Edit Dashboard</h5>

                <form onSubmit={handleUpdateDashboard}>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <input
                        className="form-control"
                        name="name"
                        value={editDashboardForm.name}
                        onChange={handleEditDashboardChange}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <input
                        className="form-control"
                        name="description"
                        value={editDashboardForm.description}
                        onChange={handleEditDashboardChange}
                      />
                    </div>

                    <div className="col-md-2">
                      <select
                        className="form-select"
                        name="access_type"
                        value={editDashboardForm.access_type}
                        onChange={handleEditDashboardChange}
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                        <option value="team">Team</option>
                      </select>
                    </div>

                    <div className="col-md-2 d-flex gap-2">
                      <button className="btn btn-success w-100">Save</button>

                      <button
                        type="button"
                        className="btn btn-secondary w-100"
                        onClick={() => setEditingDashboard(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {editingWidget && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h5 className="mb-3">Edit Widget</h5>

                <form onSubmit={handleUpdateWidget}>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <input
                        className="form-control"
                        name="title"
                        value={editWidgetForm.title}
                        onChange={handleEditWidgetChange}
                        required
                      />
                    </div>

                    <div className="col-md-3">
                      <select
                        className="form-select"
                        name="widget_type"
                        value={editWidgetForm.widget_type}
                        onChange={handleEditWidgetChange}
                      >
                        <option value="line">Line Chart</option>
                        <option value="bar">Bar Chart</option>
                        <option value="pie">Pie Chart</option>
                        <option value="kpi">KPI Card</option>
                        <option value="table">Table</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <input
                        className="form-control"
                        name="event_name"
                        value={editWidgetForm.event_name}
                        onChange={handleEditWidgetChange}
                        required
                      />
                    </div>

                    <div className="col-md-3 d-flex gap-2">
                      <button className="btn btn-success w-100">Save</button>

                      <button
                        type="button"
                        className="btn btn-secondary w-100"
                        onClick={() => setEditingWidget(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {canManageDashboard && (
            <div className="row g-4 mb-4">
              <div className="col-lg-6">
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h5 className="mb-3">Create Dashboard</h5>

                    <form onSubmit={handleCreateDashboard}>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Dashboard name"
                            value={dashboardForm.name}
                            onChange={handleDashboardChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <select
                            name="access_type"
                            className="form-select"
                            value={dashboardForm.access_type}
                            onChange={handleDashboardChange}
                          >
                            <option value="private">Private</option>
                            <option value="public">Public</option>
                            <option value="team">Team</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <select
                            name="auto_refresh_interval"
                            className="form-select"
                            value={dashboardForm.auto_refresh_interval}
                            onChange={handleDashboardChange}
                          >
                            <option value="30s">30 Seconds</option>
                            <option value="1m">1 Minute</option>
                            <option value="5m">5 Minutes</option>
                          </select>
                        </div>

                        <div className="col-md-6">
                          <input
                            name="description"
                            className="form-control"
                            placeholder="Description"
                            value={dashboardForm.description}
                            onChange={handleDashboardChange}
                          />
                        </div>

                        <div className="col-12">
                          <button className="btn btn-primary w-100">
                            Create Dashboard
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="card shadow-sm border-0">
                  <div className="card-body">
                    <h5 className="mb-3">Dashboard Templates</h5>

                    {templates.length === 0 && (
                      <p className="text-muted">No templates found.</p>
                    )}

                    {templates.map((template) => (
                      <div key={template.id} className="border rounded p-3 mb-3">
                        <h6>{template.name}</h6>
                        <p className="text-muted small mb-2">
                          {template.description}
                        </p>

                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleCreateFromTemplate(template)}
                        >
                          Use Template
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {canManageWidget && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h5 className="mb-3">Add Widget</h5>

                <form onSubmit={handleAddWidget}>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        placeholder="Widget title"
                        value={widgetForm.title}
                        onChange={handleWidgetChange}
                        required
                      />
                    </div>

                    <div className="col-md-2">
                      <select
                        name="widget_type"
                        className="form-select"
                        value={widgetForm.widget_type}
                        onChange={handleWidgetChange}
                      >
                        <option value="line">Line</option>
                        <option value="bar">Bar</option>
                        <option value="pie">Pie</option>
                        <option value="kpi">KPI</option>
                        <option value="table">Table</option>
                      </select>
                    </div>

                    <div className="col-md-3">
                      <input
                        type="text"
                        name="event_name"
                        className="form-control"
                        placeholder="Event name"
                        value={widgetForm.event_name}
                        onChange={handleWidgetChange}
                        required
                      />
                    </div>

                    <div className="col-md-2">
                      <select
                        name="time_range"
                        className="form-select"
                        value={widgetForm.time_range}
                        onChange={handleWidgetChange}
                      >
                        <option value="24hours">24 Hours</option>
                        <option value="7days">7 Days</option>
                        <option value="30days">30 Days</option>
                        <option value="90days">90 Days</option>
                      </select>
                    </div>

                    <div className="col-md-2">
                      <button className="btn btn-success w-100">
                        Add Widget
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {selectedDashboard && (
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-body">
                <h5 className="mb-1">{selectedDashboard.name}</h5>
                <p className="text-muted mb-0">
                  Access: {selectedDashboard.access_type} | Refresh:{" "}
                  {selectedDashboard.auto_refresh_interval} | Fullscreen:{" "}
                  {selectedDashboard.is_fullscreen_enabled ? "Yes" : "No"}
                </p>
              </div>
            </div>
          )}

          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <KpiCard title="Widget Event Count" value={totalWidgetEvents} />
            </div>

            <div className="col-md-6">
              <KpiCard title="Widget Total Value" value={totalAnalyticsValue} />
            </div>
          </div>

          {filteredAnalytics.length === 0 && (
            <div className="alert alert-info">
              No widget analytics found for selected filter.
            </div>
          )}

          {filteredAnalytics.length > 0 && (
            <GridLayout
              className="layout"
              layout={gridLayout}
              cols={12}
              rowHeight={90}
              width={1200}
              draggableHandle=".drag-handle"
              isDraggable={!isViewer}
              isResizable={!isViewer}
              onLayoutChange={handleLayoutChange}
            >
              {filteredAnalytics
                .filter((widget) => widget.widget_id)
                .map((widget) => {
                  const singleChartData = [
                    {
                      name: widget.widget,
                      value: widget.total_value,
                    },
                  ];

                  return (
                    <div
                      key={String(widget.widget_id)}
                      className="bg-white rounded shadow-sm border"
                    >
                      <div className="p-3 h-100 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-3 drag-handle">
                          <h6 className="mb-0">{widget.widget}</h6>

                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => setDrilldownData(widget)}
                            >
                              Drill
                            </button>

                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleExportWidget(widget)}
                            >
                              Export
                            </button>

                            {canManageWidget && (
                              <>
                                <button
                                  className="btn btn-sm btn-warning"
                                  onClick={() => openEditWidget(widget)}
                                >
                                  Edit
                                </button>

                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() =>
                                    handleDeleteWidget(widget.widget_id)
                                  }
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex-grow-1">
                          {widget.type === "kpi" ? (
                            <KpiCard
                              title={widget.widget}
                              value={widget.total_value}
                            />
                          ) : widget.type === "table" ? (
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
                          ) : (
                            <WidgetChart
                              type={widget.type}
                              data={singleChartData}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </GridLayout>
          )}

          <div className="row g-4 mt-4">
            <div className="col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5>Live Event Stream</h5>

                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Event</th>
                          <th>Value</th>
                          <th>Source</th>
                          <th>Time</th>
                        </tr>
                      </thead>

                      <tbody>
                        {liveEvents.map((event, index) => (
                          <tr key={event.id || index}>
                            <td>{event.event_name || event.name || "N/A"}</td>
                            <td>{event.event_value || event.value || 0}</td>
                            <td>{event.source_type || "api"}</td>
                            <td>
                              {event.created_at
                                ? new Date(event.created_at).toLocaleTimeString()
                                : new Date().toLocaleTimeString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {liveEvents.length === 0 && (
                      <p className="text-muted mb-0">
                        Waiting for live events...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5>Alerts</h5>

                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Condition</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {alerts.slice(0, 5).map((alert, index) => (
                        <tr key={alert.id || index}>
                          <td>{alert.metric_name}</td>
                          <td>
                            {alert.condition} {alert.threshold_value}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                alert.status === "triggered" ||
                                alert.status === "Triggered"
                                  ? "bg-danger"
                                  : alert.status === "resolved" ||
                                    alert.status === "Resolved"
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {alert.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {alerts.length === 0 && (
                    <p className="text-muted">No alerts found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {drilldownData && (
            <div
              className="modal d-block"
              tabIndex="-1"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">
                      Drill-down Analytics: {drilldownData.widget}
                    </h5>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setDrilldownData(null)}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <KpiCard
                          title="Total Events"
                          value={drilldownData.total_events}
                        />
                      </div>

                      <div className="col-md-4">
                        <KpiCard
                          title="Total Value"
                          value={drilldownData.total_value}
                        />
                      </div>

                      <div className="col-md-4">
                        <KpiCard title="Chart Type" value={drilldownData.type} />
                      </div>
                    </div>

                    <WidgetChart
                      type={drilldownData.type}
                      data={[
                        {
                          name: drilldownData.widget,
                          value: drilldownData.total_value,
                        },
                      ]}
                    />

                    <pre className="bg-light p-3 mt-3 rounded">
                      {JSON.stringify(drilldownData, null, 2)}
                    </pre>
                  </div>

                  <div className="modal-footer">
                    <button
                      className="btn btn-secondary"
                      onClick={() => setDrilldownData(null)}
                    >
                      Close
                    </button>

                    <button
                      className="btn btn-success"
                      onClick={() => handleExportWidget(drilldownData)}
                    >
                      Export Drill-down
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="row g-4 mt-4">
            <div className="col-lg-12">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5>Recent Events</h5>

                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Value</th>
                        <th>Source</th>
                      </tr>
                    </thead>

                    <tbody>
                      {events.slice(0, 5).map((event, index) => (
                        <tr key={event.id || index}>
                          <td>{event.event_name}</td>
                          <td>{event.event_value}</td>
                          <td>{event.source_type || "api"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {events.length === 0 && (
                    <p className="text-muted">No events found.</p>
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

export default Dashboard;