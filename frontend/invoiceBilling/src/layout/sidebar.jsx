import { NavLink } from "react-router-dom";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const navigationItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "▣",
    },
    {
      name: "Customers",
      path: "/customers",
      icon: "♙",
    },

    {
      name:"Products",
      path: "/products",
      icon: "▦",
    },
    {
      name: "Invoices",
      path: "/invoices",
      icon: "▤",
    },
    {
      name: "Payments",
      path: "/payments",
      icon: "₹",
    },
    {
      name: "Statements",
      path: "/statements",
      icon: "▥",
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 h-screen w-64
          bg-white border-r border-gray-200
          transform transition-transform duration-200
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Invoice Billing
            </h1>

            <p className="text-xs text-gray-500">
              Billing Management
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </p>

          <div className="space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `
                  flex items-center gap-3 rounded-lg px-3 py-2.5
                  text-sm font-medium transition
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                  `
                }
              >
                <span className="w-5 text-center">
                  {item.icon}
                </span>

                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;