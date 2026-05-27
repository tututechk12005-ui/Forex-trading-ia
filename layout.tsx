import { useAuth } from "./auth-provider";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  BarChart2, 
  Settings, 
  ShieldAlert, 
  LogOut,
  LineChart
} from "lucide-react";
import { Button } from "./ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/signals", label: "Signals", icon: LineChart },
    { href: "/stats", label: "Stats", icon: BarChart2 },
  ];

  if (user?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: ShieldAlert });
    navItems.push({ href: "/settings", label: "Settings", icon: Settings });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground dark">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border/40 bg-card/50 backdrop-blur-xl flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Activity className="w-6 h-6" />
            <span>ForexSignal AI</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium neon-glow"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{user?.username}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(0,255,209,0.1) 0%, transparent 70%)" }} />
        <div className="p-8 max-w-7xl mx-auto relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}
