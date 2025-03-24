import { Link, useLocation } from "wouter"
import { Home, Camera, Video, Bell, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation()

  const navItems = [
    { href: "/", label: "Trang chủ", icon: Home },
    { href: "/cameras", label: "Camera", icon: Camera },
    { href: "/recordings", label: "Ghi hình", icon: Video },
    { href: "/alerts", label: "Cảnh báo", icon: Bell },
    { href: "/settings", label: "Cài đặt", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-card border-r p-4 flex flex-col">
        <div className="text-2xl font-bold text-primary mb-8 flex items-center">
          <Camera className="mr-2 h-6 w-6" />
          <span>Camera Monitor</span>
        </div>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = location === item.href
            const Icon = item.icon
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
              >
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-md",
                    "transition-colors duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="mr-2 h-5 w-5" />
                  {item.label}
                </a>
              </Link>
            )
          })}
        </nav>
        <div className="pt-4 mt-auto text-xs text-muted-foreground border-t">
          <div className="flex justify-between">
            <span>Camera Monitor v1.0</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}