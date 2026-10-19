import { useNavigate, useLocation } from "react-router-dom";
import { List, PieChart, Plus, Target, Settings } from "lucide-react";
import { useAppContext } from "../AppContext";

const navItems = [
  { id: "/history", icon: List, label: "History" },
  { id: "/", icon: PieChart, label: "Analytics" },
  { id: "/add", icon: Plus, label: "Add", isAdd: true },
  { id: "/goals", icon: Target, label: "Goals" },
  { id: "/settings", icon: Settings, label: "Settings" },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme } = useAppContext();
  const isDark = theme === "dark";

  return (
    <nav
      aria-label="Main navigation"
      className={`bottom-nav fixed inset-x-0 z-50 mx-auto flex w-[min(92%,420px)] items-center justify-between rounded-[28px] px-2 py-2 ${isDark ? "bottom-nav-dark" : "bottom-nav-light"}`}
    >
      {navItems.map(({ id, icon: Icon, label, isAdd }) => {
        const isActive = pathname === id;

        if (isAdd) {
          return (
            <button
              key={id}
              type="button"
              aria-label="Add transaction"
              onClick={() => navigate(id)}
              className="nav-add group flex h-[52px] w-[56px] shrink-0 items-center justify-center rounded-[20px] transition-transform duration-200 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <Icon size={25} strokeWidth={2.6} aria-hidden="true" />
            </button>
          );
        }

        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            onClick={() => navigate(id)}
            className={`nav-item group relative flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-emerald-500 ${isActive ? "nav-item-active" : ""}`}
          >
            <span className="nav-icon-wrap relative flex h-6 items-center justify-center">
              <Icon
                className="nav-icon relative z-10 transition-transform duration-300 group-active:scale-90"
                size={21}
                strokeWidth={2}
                aria-hidden="true"
              />
            </span>
            <span className="text-[10px] font-semibold leading-none tracking-[0.01em]">
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
