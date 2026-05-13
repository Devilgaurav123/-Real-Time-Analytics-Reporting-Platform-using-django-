import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Reports() {
  const [reports, setReports] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    dashboard: "",
    frequency: "daily",
    email: "",
  });

  useEffect(() => {
    fetchReportsPageData();
  }, []);

  const fetchReportsPageData = async () => {
    try {
      const [dashboardRes, reportRes] = await Promise.all([
        api.get("dashboards/list/"),
        api.get("dashboards/report-history/"),
      ]);

      setDashboards(dashboardRes.data);
      setReports(reportRes.data);

      if (dashboardRes.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          dashboard: dashboardRes.data[0].id,
        }));
      }
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to load reports data");
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

  const handleScheduleReport = async (e) => {
    e.preventDefault();

    try {
      await api.post("dashboards/schedule-report/", {
        dashboard: Number(formData.dashboard),
        frequency: formData.frequency,
        email: formData.email,
      });

      toast.success("Report scheduled successfully");

      setFormData({
        dashboard: dashboards[0]?.id || "",
        frequency: "daily",
        email: "",
      });

      fetchReportsPageData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to schedule report");
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const response = await api.get(`dashboards/download-report/${reportId}/`);

      const pdfUrl = response.data.pdf_url;
      const pngUrl = response.data.png_url;

      if (pdfUrl) {
        window.open(`http://127.0.0.1:8000${pdfUrl}`, "_blank");
      }

      if (pngUrl) {
        window.open(`http://127.0.0.1:8000${pngUrl}`, "_blank");
      }

      if (!pdfUrl && !pngUrl) {
        toast.info("Report files are still generating. Please refresh after some time.");
      }
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to download report");
    }
  };

  if (loading) {
    return <h3 className="p-4">Loading reports...</h3>;
  }

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="container-fluid p-4">
          <h3 className="mb-4">Scheduled Reports</h3>

          <div className="row g-4">
            <div className="col-lg-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Schedule New Report</h5>

                  <form onSubmit={handleScheduleReport}>
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
                      <label className="form-label">Frequency</label>
                      <select
                        name="frequency"
                        className="form-select"
                        value={formData.frequency}
                        onChange={handleChange}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Recipient Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <button className="btn btn-primary w-100">
                      Schedule Report
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Report History</h5>

                  <table className="table table-bordered table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Dashboard</th>
                        <th>Frequency</th>
                        <th>Status</th>
                        <th>Created At</th>
                        <th>Download</th>
                      </tr>
                    </thead>

                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id}>
                          <td>{report.id}</td>
                          <td>{report.dashboard}</td>
                          <td>{report.frequency}</td>
                          <td>{report.report_status || "pending"}</td>
                          <td>
                            {new Date(report.created_at).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleDownload(report.id)}
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {reports.length === 0 && (
                    <p className="text-muted">No reports found.</p>
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

export default Reports;