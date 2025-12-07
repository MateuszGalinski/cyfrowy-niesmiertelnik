import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  X,
  LayoutDashboard,
  History,
  Route,
  Menu,
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/history", label: "Historia alertów", icon: History },
  { path: "/tracking", label: "Śledzenie tras", icon: Route },
];

export function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const location = useLocation();

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      setButtonRect(e.currentTarget.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={handleToggle}
        className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center hover:from-orange-400 hover:to-red-500 transition-all shadow-lg"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Portal - renders menu at body level to avoid z-index issues */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div 
            className="fixed w-56 bg-card border border-border rounded-lg shadow-xl py-2 overflow-hidden"
            style={{
              zIndex: 9999,
              top: buttonRect ? buttonRect.bottom + 8 : 60,
              left: buttonRect ? buttonRect.left : 16,
            }}
          >
            <div className="px-4 py-2 border-b border-border mb-2">
              <div className="font-semibold text-sm">Cyfrowy Nieśmiertelnik</div>
              <div className="text-xs text-muted-foreground">Nawigacja</div>
            </div>
            
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </>
  );
}