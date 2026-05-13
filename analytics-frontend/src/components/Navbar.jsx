import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    navigate("/login");
  };

  return (
    <div
      className="bg-white shadow-sm px-4 py-3 d-flex justify-content-between align-items-center"
    >
      <h4 className="mb-0">
        Real-Time Analytics Dashboard
      </h4>

      <button
        className="btn btn-danger"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;