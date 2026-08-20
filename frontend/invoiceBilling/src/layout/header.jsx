import { useLocation } from "react-router-dom";

function Header({ setSidebarOpen }) {
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith("/customers")) {
      return "Customers";
    }

    if (location.pathname.startsWith("/invoices")) {
      return "Invoices";
    }

    if (location.pathname.startsWith("/payments")) {
      return "Payments";
    }

    if (location.pathname.startsWith("/statements")) {
      return "Statements";
    }

    return "Dashboard";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open menu"
        >
          ☰
        </button>

        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {getPageTitle()}
          </h2>

          <p className="hidden text-xs text-gray-500 sm:block">
            Invoice Billing Application
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="hidden items-center gap-3 sm:flex">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-800">
            Admin
          </p>

          <p className="text-xs text-gray-500">
            Billing Manager
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          A
        </div>
      </div>
    </header>
  );
}

export default Header;