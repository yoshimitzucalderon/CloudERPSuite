import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Bell, Settings, User } from "lucide-react";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b bg-white dark:bg-gray-800 flex items-center justify-end px-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            {(user as any)?.profileImageUrl ? (
              <img
                src={(user as any).profileImageUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="h-4 w-4 text-white" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {(user as any)?.firstName || 'Usuario'}
          </span>
        </div>
      </div>
    </header>
  );
}