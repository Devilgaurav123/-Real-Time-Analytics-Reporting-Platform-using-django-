import { useState } from "react";
import { toast } from "react-toastify";

import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function ApiKeys() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerateKey = async () => {
    try {
      setLoading(true);

      const response = await api.post("ingestion/generate-api-key/");
      toast.success("API key generated successfully");

      setApiKeys((prev) => [response.data, ...prev]);
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to generate API key");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeKey = async (keyId) => {
    try {
      await api.post(`ingestion/revoke-api-key/${keyId}/`);
      toast.success("API key revoked");

      setApiKeys((prev) =>
        prev.map((key) =>
          key.id === keyId ? { ...key, is_active: false } : key
        )
      );
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to revoke API key");
    }
  };

  const handleRotateKey = async (keyId) => {
    try {
      const response = await api.post(`ingestion/rotate-api-key/${keyId}/`);
      toast.success("API key rotated");

      setApiKeys((prev) =>
        prev.map((key) =>
          key.id === keyId ? { ...key, is_active: false } : key
        )
      );

      setApiKeys((prev) => [response.data.new_key, ...prev]);
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to rotate API key");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="container-fluid p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3>API Key Management</h3>
              <p className="text-muted mb-0">
                Generate, revoke and rotate organization API keys.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleGenerateKey}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate API Key"}
            </button>
          </div>

          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="mb-3">Generated API Keys</h5>

              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>API Key</th>
                    <th>Status</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {apiKeys.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td style={{ maxWidth: "300px", wordBreak: "break-all" }}>
                        {item.key}
                      </td>
                      <td>
                        {item.is_active ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-danger">Revoked</span>
                        )}
                      </td>
                      <td>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : "-"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          disabled={!item.is_active}
                          onClick={() => handleRevokeKey(item.id)}
                        >
                          Revoke
                        </button>

                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleRotateKey(item.id)}
                        >
                          Rotate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {apiKeys.length === 0 && (
                <p className="text-muted">
                  No API keys generated yet. Click Generate API Key.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiKeys;