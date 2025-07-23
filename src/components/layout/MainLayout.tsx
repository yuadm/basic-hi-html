import { ReactNode, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  HelpCircle, 
  Moon, 
  Sun, 
  Plus, 
  Filter,
  Download,
  Calendar,
  ChevronDown,
  Zap,
  Activity,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, userRole, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Enhanced Top Header */}
          <header className="sticky top-0 z-50 glass border-b border-border/30 px-6 py-4 animate-fade-in">
            <div className="flex items-center justify-between">
              {/* Left Section */}
              <div className="flex items-center gap-6">
                <SidebarTrigger className="lg:hidden hover:bg-sidebar-accent rounded-lg transition-all duration-300 hover:scale-110" />
                
                {/* Enhanced Search Bar */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search employees, documents, leaves..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 w-96 bg-background/60 border-input-border/60 focus:bg-background focus:border-primary/50 rounded-xl transition-all duration-300 focus:shadow-glow"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <kbd className="px-2 py-1 text-xs bg-muted rounded border text-muted-foreground">⌘K</kbd>
                  </div>
                </div>

                {/* Quick Stats Pills */}
                <div className="hidden lg:flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/10">
                    <Activity className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">3 Pending</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning/5 border border-warning/10">
                    <Clock className="w-3 h-3 text-warning" />
                    <span className="text-xs font-medium text-warning">7 Expiring</span>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-3">
                {/* Quick Actions */}
                <div className="hidden md:flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10 rounded-xl transition-all duration-300 hover:scale-105">
                        <Plus className="w-4 h-4" />
                        <span className="hidden lg:inline">Create</span>
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 glass border-border/20">
                      <DropdownMenuLabel className="font-semibold">Quick Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                        <User className="w-4 h-4 mr-2" />
                        Add Employee
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                        <Calendar className="w-4 h-4 mr-2" />
                        Leave Request
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="ghost" size="sm" className="hover:bg-secondary/80 rounded-xl transition-all duration-300 hover:scale-105">
                    <Filter className="w-4 h-4" />
                  </Button>
                </div>

                {/* Theme Toggle */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="hover:bg-secondary/80 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative hover:bg-secondary/80 rounded-xl transition-all duration-300 hover:scale-105">
                      <Bell className="w-4 h-4" />
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs rounded-full flex items-center justify-center p-0 bg-destructive text-destructive-foreground animate-pulse">
                        3
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 glass border-border/20">
                    <DropdownMenuLabel className="font-semibold flex items-center justify-between">
                      Notifications
                      <Badge variant="destructive" className="text-xs">3 New</Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="max-h-64 overflow-y-auto space-y-1 p-1">
                      <div className="px-3 py-2 hover:bg-primary/5 rounded-lg cursor-pointer transition-colors">
                        <div className="text-sm font-medium">Leave request pending</div>
                        <div className="text-xs text-muted-foreground">John Doe submitted a leave request</div>
                        <div className="text-xs text-muted-foreground mt-1">2 minutes ago</div>
                      </div>
                      <div className="px-3 py-2 hover:bg-warning/5 rounded-lg cursor-pointer transition-colors">
                        <div className="text-sm font-medium">Document expiring soon</div>
                        <div className="text-xs text-muted-foreground">Passport expires in 30 days</div>
                        <div className="text-xs text-muted-foreground mt-1">1 hour ago</div>
                      </div>
                      <div className="px-3 py-2 hover:bg-success/5 rounded-lg cursor-pointer transition-colors">
                        <div className="text-sm font-medium">Compliance task completed</div>
                        <div className="text-xs text-muted-foreground">Monthly safety check done</div>
                        <div className="text-xs text-muted-foreground mt-1">3 hours ago</div>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Help */}
                <Button variant="ghost" size="sm" className="hover:bg-secondary/80 rounded-xl transition-all duration-300 hover:scale-105">
                  <HelpCircle className="w-4 h-4" />
                </Button>

                {/* User Profile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 hover:bg-secondary/80 rounded-xl transition-all duration-300 hover:scale-105 px-3 py-2">
                      <Avatar className="w-8 h-8 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm">
                          {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <div className="text-sm font-medium text-foreground truncate max-w-32">
                          {user?.email || 'Unknown User'}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {userRole || 'user'}
                        </div>
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass border-border/20">
                    <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                      <Settings className="w-4 h-4 mr-2" />
                      Preferences
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer hover:bg-primary/5 transition-colors">
                      <Zap className="w-4 h-4 mr-2" />
                      Keyboard Shortcuts
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer hover:bg-destructive/5 text-destructive transition-colors"
                      onClick={signOut}
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto animate-fade-in">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}