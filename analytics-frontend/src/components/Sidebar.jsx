import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Events",
      path: "/events",
    },
    {
      name: "Alerts",
      path: "/alerts",
    },
    {
      name: "Reports",
      path: "/reports",
    },
    {
      name: "API Keys",
      path: "/api-keys",
    },
    {
      name: "Organization",
      path: "/organization",
    },
  ];

  return (
    <div
      className="bg-dark text-white p-3"
      style={{
        width: "250px",
        minHeight: "100vh",
      }}
    >
      <h3 className="mb-4">Analytics</h3>

      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`d-block text-decoration-none p-2 rounded mb-2 ${
            location.pathname === item.path
              ? "bg-primary text-white"
              : "text-light"
          }`}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}

export default Sidebar;