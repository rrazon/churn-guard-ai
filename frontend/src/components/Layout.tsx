import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { wsService } from '../services/websocket';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from './ui/sheet';
import {
  BarChart3,
  Users,
  AlertTriangle,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  Bell,
  Shield,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { user, logout, hasRole } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      wsService.connect(user.id);

      const unsubscribeAlerts = wsService.subscribe('alerts', (message) => {
        if (message.type === 'new_alert') {
          setNotifications(prev => [message, ...prev.slice(0, 9)]); // Keep last 10
          setUnreadCount(prev => prev + 1);
        }
      });

      return () => {
        unsubscribeAlerts();
      };
    }
  }, [user]);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      icon: BarChart3,
      roles: ['admin', 'executive', 'csm', 'readonly'],
    },
    {
      id: 'customers',
      label: 'Customer Management',
      icon: Users,
      roles: ['admin', 'csm', 'readonly'],
    },
    {
      id: 'csm',
      label: 'CSM Dashboard',
      icon: TrendingUp,
      roles: ['admin', 'csm'],
    },
    {
      id: 'alerts',
      label: 'Alerts & Notifications',
      icon: AlertTriangle,
      roles: ['admin', 'executive', 'csm'],
    },
  ];

  const visibleNavItems = navigationItems.filter(item => 
    hasRole(item.roles)
  );

  const handleLogout = () => {
    wsService.disconnect();
    logout();
  };

  const clearNotifications = () => {
    setUnreadCount(0);
  };

  const NavContent = () => (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold">ChurnGuard AI</h2>
        </div>
        <div className="space-y-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onPageChange(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <NavContent />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="font-semibold">ChurnGuard AI</span>
          </div>
          
          <div className="w-6" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Top Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {visibleNavItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearNotifications}>
                        Mark all read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No recent notifications
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((notification, index) => (
                      <DropdownMenuItem key={index} className="flex flex-col items-start p-3">
                        <div className="font-medium text-sm">{notification.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <Badge variant="secondary" className="w-fit mt-1">
                        {user?.role?.toUpperCase()}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hasRole('admin') && (
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
