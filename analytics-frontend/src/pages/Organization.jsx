import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import api from "../api/axios";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

function Organization() {
  const [organizations, setOrganizations] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [invites, setInvites] = useState([]);

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "viewer",
  });

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const [orgRes, membersRes, invitesRes] = await Promise.all([
        api.get("organizations/"),
        api.get("organizations/team-members/"),
        api.get("accounts/invite-list/"),
      ]);

      setOrganizations(orgRes.data);
      setTeamMembers(membersRes.data);
      setInvites(invitesRes.data);
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to load organization data");
    }
  };

  const handleInviteChange = (e) => {
    setInviteForm({
      ...inviteForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();

    try {
      await api.post("accounts/invite-member/", inviteForm);

      toast.success("Team invite created successfully");

      setInviteForm({
        email: "",
        role: "viewer",
      });

      fetchOrganizationData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to invite member");
    }
  };

  const handleRemoveMember = async (userId) => {
    try {
      await api.delete(`organizations/remove-member/${userId}/`);

      toast.success("Member removed successfully");
      fetchOrganizationData();
    } catch (error) {
      console.log(error.response?.data || error);
      toast.error("Failed to remove member");
    }
  };

  return (
    <div className="d-flex">
      <Sidebar />

      <div className="flex-grow-1 bg-light" style={{ minHeight: "100vh" }}>
        <Navbar />

        <div className="container-fluid p-4">
          <h3 className="mb-4">Organization & Team</h3>

          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Organizations</h5>

                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {organizations.map((org) => (
                        <tr key={org.id}>
                          <td>{org.id}</td>
                          <td>{org.name}</td>
                          <td>
                            {org.is_active ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-danger">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {organizations.length === 0 && (
                    <p className="text-muted">No organization found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Invite Team Member</h5>

                  <form onSubmit={handleInvite}>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control"
                        value={inviteForm.email}
                        onChange={handleInviteChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select
                        name="role"
                        className="form-select"
                        value={inviteForm.role}
                        onChange={handleInviteChange}
                      >
                        <option value="admin">Admin</option>
                        <option value="analyst">Analyst</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>

                    <button className="btn btn-primary w-100">
                      Send Invite
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Team Members</h5>

                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id}>
                          <td>{member.username}</td>
                          <td>{member.email}</td>
                          <td>{member.role}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {teamMembers.length === 0 && (
                    <p className="text-muted">No team members found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h5 className="mb-3">Invite History</h5>

                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Used</th>
                      </tr>
                    </thead>

                    <tbody>
                      {invites.map((invite) => (
                        <tr key={invite.id}>
                          <td>{invite.email}</td>
                          <td>{invite.role}</td>
                          <td>{invite.is_used ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {invites.length === 0 && (
                    <p className="text-muted">No invites found.</p>
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

export default Organization;