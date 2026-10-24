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
              className="group relative flex h-[52px] w-[56px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-tr from-zinc-900 to-zinc-700 text-white shadow-lg shadow-black/40 transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden ring-1 ring-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
            >
              {/* Vệt sáng lướt qua */}
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100"></div>

              <Icon
                size={25}
                strokeWidth={2.6}
                className="relative z-10 transition-transform duration-300 group-hover:rotate-90 group-active:rotate-90"
                aria-hidden="true"
              />
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
            className={`group relative flex h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-zinc-500 ${isActive ? (isDark ? "text-white" : "text-black") : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300"}`}
          >
            <span className="relative flex h-6 items-center justify-center">
              <Icon
                className={`relative z-10 transition-transform duration-300 group-active:scale-90 ${isActive ? "scale-110" : "scale-100"}`}
                size={21}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
            </span>
            <span
              className={`text-[10px] leading-none tracking-[0.01em] transition-all duration-300 ${isActive ? "font-bold scale-105" : "font-medium"}`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
