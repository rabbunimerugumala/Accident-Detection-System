import { LayoutDashboard, Map as MapIcon, Activity, Bell, Shield, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: MapIcon, label: 'Map View', id: 'map' },
    { icon: Activity, label: 'Sensor Data', id: 'sensors' },
    { icon: Bell, label: 'Alerts', id: 'alerts' },
];

export function Sidebar({ activeTab, onTabChange }: { activeTab: string, onTabChange: (id: string) => void }) {
    return (
        <div className="flex flex-col h-screen w-64 glass border-r bg-card/50 text-foreground fixed left-0 top-0 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="p-2 bg-critical/20 rounded-lg">
                    <Shield className="w-6 h-6 text-critical" />
                </div>
                <span className="font-bold text-xl tracking-tight">LifeGuardX</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                            activeTab === item.id
                                ? "bg-accent text-white shadow-lg shadow-accent/20"
                                : "hover:bg-accent/10 text-muted-foreground hover:text-accent"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-white" : "group-hover:text-accent")} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-border/50">
                <div className="p-4 rounded-xl bg-accent/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-accent uppercase tracking-wider">System Health</span>
                        <div className="w-2 h-2 rounded-full bg-safety animate-pulse" />
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5">
                        <div className="bg-safety h-1.5 rounded-full w-[95%]" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">All systems operational</p>
                </div>

                <button className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-muted-foreground hover:text-critical hover:bg-critical/5 rounded-xl transition-colors">
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
}
