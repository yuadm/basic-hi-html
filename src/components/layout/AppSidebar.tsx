
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Shield,
  Settings,
  UserCog,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Bookmark,
  Plus,
  Clock,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { usePermissions } from "@/contexts/PermissionsContext";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Overview & Analytics",
    requiredPage: "/",
    badge: null,
    quickActions: [
      { label: "Create Report", icon: Plus },
      { label: "View Stats", icon: Activity }
    ]
  },
  {
    title: "Employees",
    url: "/employees",
    icon: Users,
    description: "Manage Staff",
    requiredPage: "/employees",
    badge: { count: 24, variant: "default" },
    quickActions: [
      { label: "Add Employee", icon: Plus },
      { label: "Export List", icon: FileText }
    ]
  },
  {
    title: "Leaves",
    url: "/leaves",
    icon: Calendar,
    description: "Time Off Management",
    requiredPage: "/leaves",
    badge: { count: 3, variant: "destructive" },
    quickActions: [
      { label: "Approve Leave", icon: Clock },
      { label: "View Calendar", icon: Calendar }
    ]
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    description: "Document Tracking",
    requiredPage: "/documents",
    badge: { count: 7, variant: "warning" },
    quickActions: [
      { label: "Upload Doc", icon: Plus },
      { label: "Expiring Soon", icon: Clock }
    ]
  },
  {
    title: "Compliance",
    url: "/compliance",
    icon: Shield,
    description: "Regulatory Tasks",
    requiredPage: "/compliance",
    badge: { count: 2, variant: "secondary" },
    quickActions: [
      { label: "New Task", icon: Plus },
      { label: "View Reports", icon: BarChart3 }
    ]
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
    description: "Analytics & Export",
    requiredPage: "/reports",
    badge: null,
    quickActions: [
      { label: "Generate", icon: Plus },
      { label: "Schedule", icon: Clock }
    ]
  },
];

const settingsItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "System Configuration",
    requiredPage: "/settings",
    badge: null,
    quickActions: [
      { label: "Company", icon: Building2 },
      { label: "Users", icon: Users }
    ]
  },
  {
    title: "User Management",
    url: "/user-management",
    icon: UserCog,
    description: "Roles & Permissions",
    requiredPage: "/user-management",
    badge: null,
    quickActions: [
      { label: "Add User", icon: Plus },
      { label: "Permissions", icon: Shield }
    ]
  },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const { companySettings } = useCompany();
  const { user, userRole, signOut } = useAuth();
  const { hasPageAccess } = usePermissions();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return cn(
      "group relative flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-300",
      "hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5",
      "hover:shadow-md hover:scale-[1.02] hover:translate-x-1",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
      active
        ? "bg-gradient-primary text-primary-foreground shadow-glow scale-[1.02] translate-x-1"
        : "text-sidebar-foreground hover:text-sidebar-primary",
      "animate-fade-in"
    );
  };

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case "destructive": return "destructive";
      case "warning": return "secondary";
      case "secondary": return "outline";
      default: return "default";
    }
  };

  // Filter navigation items based on permissions and search
  const accessibleNavigationItems = navigationItems.filter(item => 
    hasPageAccess(item.requiredPage) &&
    (searchQuery === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const accessibleSettingsItems = settingsItems.filter(item => 
    hasPageAccess(item.requiredPage) &&
    (searchQuery === "" || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Sidebar
      className={cn(
        "border-r border-sidebar-border bg-gradient-surface backdrop-blur-xl transition-all duration-500",
        "glass shadow-xl",
        collapsed ? "w-16" : "w-72"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-4 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent">
                  {companySettings.name || "HR System"}
                </h1>
                <p className="text-xs text-sidebar-foreground/60 font-medium">
                  {companySettings.tagline || "Intelligent Management"}
                </p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-9 h-9 p-0 hover:bg-sidebar-accent rounded-xl transition-all duration-300",
              "hover:scale-110 hover:shadow-md",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Search Bar */}
        {!collapsed && (
          <div className="mt-4 animate-fade-in">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search menus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-sidebar-border/50 focus:bg-background transition-all duration-300"
              />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-6 space-y-6 overflow-hidden">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/70 font-bold mb-3 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Main Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {accessibleNavigationItems.map((item, index) => (
                <SidebarMenuItem key={item.title} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(item.url)}
                      onMouseEnter={() => !collapsed && setShowQuickActions(item.title)}
                      onMouseLeave={() => setShowQuickActions(null)}
                    >
                      <div className="relative">
                        <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                        {item.badge && !collapsed && (
                          <Badge 
                            variant={getBadgeVariant(item.badge.variant)} 
                            className="absolute -top-2 -right-2 w-5 h-5 text-xs rounded-full flex items-center justify-center p-0 animate-pulse"
                          >
                            {item.badge.count}
                          </Badge>
                        )}
                      </div>
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{item.title}</div>
                            {item.badge && (
                              <Badge 
                                variant={getBadgeVariant(item.badge.variant)} 
                                className="ml-2 text-xs"
                              >
                                {item.badge.count}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs opacity-70 truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {accessibleSettingsItems.length > 0 && (
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/70 font-bold mb-3 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Administration
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-2">
                {accessibleSettingsItems.map((item, index) => (
                  <SidebarMenuItem key={item.title} className="animate-fade-in" style={{ animationDelay: `${(accessibleNavigationItems.length + index) * 50}ms` }}>
                    <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                      <NavLink to={item.url} className={getNavClassName(item.url)}>
                        <item.icon className="w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110" />
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs opacity-70 truncate">
                              {item.description}
                            </div>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick Stats - Only when not collapsed */}
        {!collapsed && (
          <SidebarGroup className="animate-fade-in">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/70 font-bold mb-3 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Quick Stats
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-3">
                <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-xs text-primary/70 font-medium">Pending Approvals</div>
                  <div className="text-lg font-bold text-primary">3</div>
                </div>
                <div className="px-3 py-2 rounded-lg bg-warning/5 border border-warning/10">
                  <div className="text-xs text-warning/70 font-medium">Expiring Soon</div>
                  <div className="text-lg font-bold text-warning">7</div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 px-3 py-4 space-y-3 bg-gradient-to-t from-sidebar-accent/20 to-transparent">
        {!collapsed ? (
          <div className="animate-fade-in space-y-3">
            {/* User Profile Card */}
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-sidebar-accent/30 to-sidebar-accent/10 border border-sidebar-border/50 backdrop-blur-sm">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user?.email || 'Unknown User'}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {userRole || 'user'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span className="text-xs text-sidebar-foreground/60">Online</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 gap-2 text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Bell className="w-4 h-4" />
                <span className="text-xs">Alerts</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="flex-1 gap-2 text-destructive hover:text-destructive-foreground hover:bg-destructive rounded-lg transition-all duration-300 hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs">Sign Out</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            <Avatar className="w-10 h-10 mx-auto ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-primary text-white font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 mx-auto p-0 hover:bg-sidebar-accent rounded-lg transition-all duration-300 hover:scale-110"
              >
                <Bell className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-10 h-10 mx-auto p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-all duration-300 hover:scale-110"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
