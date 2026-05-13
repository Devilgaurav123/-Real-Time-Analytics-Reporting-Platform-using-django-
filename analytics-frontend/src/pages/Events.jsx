import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState(null);

  const [singleEvent, setSingleEvent] = useState({
    event_name: "",
    event_value: "",
    event_type: "",
    timestamp: "",
  });

  const [batchText, setBatchText] = useState(
    JSON.stringify(
      {
        events: [
          {
            event_name: "signup",
            event_value: 1,
            event_type: "user",
            metadata: {},
            timestamp: new Date().toISOString(),
          },
        ],
      },
      null,
      2
    )
  );

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get("ingestion/events/");
      setEvents(response.data);
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleSingleChange = (e) => {
    setSingleEvent({
      ...singleEvent,
      [e.target.name]: e.target.value,
    });
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("ingestion/single-event/", {
        ...singleEvent,
        event_value: Number(singleEvent.event_value),
        metadata: {},
        timestamp: singleEvent.timestamp || new Date().toISOString(),
      });

      toast.success("Single event queued successfully");

      setSingleEvent({
        event_name: "",
        event_value: "",
        event_type: "",
        timestamp: "",
      });

      fetchEvents();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to create event");
    }
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();

    try {
      const parsedData = JSON.parse(batchText);

      await api.post("ingestion/batch-event/", parsedData);

      toast.success("Batch events queued successfully");
      fetchEvents();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Invalid JSON or batch upload failed");
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();

    if (!csvFile) {
      toast.error("Please select CSV file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", csvFile);

      await api.post("ingestion/upload-csv/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("CSV uploaded successfully");
      setCsvFile(null);
      fetchEvents();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("CSV upload failed");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="container-fluid p-4">
          <h3 className="mb-4">Events & Data Ingestion</h3>

          <div className="row g-4 mb-4">
            <div className="col-lg-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Single Event</h5>

                  <form onSubmit={handleSingleSubmit}>
                    <input
                      className="form-control mb-3"
                      name="event_name"
                      placeholder="Event name"
                      value={singleEvent.event_name}
                      onChange={handleSingleChange}
                      required
                    />

                    <input
                      className="form-control mb-3"
                      type="number"
                      name="event_value"
                      placeholder="Event value"
                      value={singleEvent.event_value}
                      onChange={handleSingleChange}
                      required
                    />

                    <input
                      className="form-control mb-3"
                      name="event_type"
                      placeholder="Event type"
                      value={singleEvent.event_type}
                      onChange={handleSingleChange}
                    />

                    <input
                      className="form-control mb-3"
                      type="datetime-local"
                      name="timestamp"
                      value={singleEvent.timestamp}
                      onChange={handleSingleChange}
                    />

                    <button className="btn btn-primary w-100">
                      Submit Single Event
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Batch Events</h5>

                  <form onSubmit={handleBatchSubmit}>
                    <textarea
                      className="form-control mb-3"
                      rows="9"
                      value={batchText}
                      onChange={(e) => setBatchText(e.target.value)}
                    />

                    <button className="btn btn-success w-100">
                      Submit Batch Events
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">CSV Upload</h5>

                  <p className="text-muted small">
                    CSV columns: event_name, event_value, event_type, timestamp
                  </p>

                  <form onSubmit={handleCsvUpload}>
                    <input
                      type="file"
                      accept=".csv"
                      className="form-control mb-3"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                    />

                    <button className="btn btn-warning w-100">
                      Upload CSV
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="mb-3">All Events</h5>

              {loading ? (
                <p>Loading events...</p>
              ) : (
                <table className="table table-bordered table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Event Name</th>
                      <th>Value</th>
                      <th>Type</th>
                      <th>Source</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>

                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td>{event.id}</td>
                        <td>{event.event_name}</td>
                        <td>{event.event_value}</td>
                        <td>{event.event_type || "-"}</td>
                        <td>{event.source_type || "api"}</td>
                        <td>{new Date(event.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {!loading && events.length === 0 && (
                <p className="text-muted">No events found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Events;