import { NavLink } from 'react-router-dom';
import { Home, Flower2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 backdrop-blur-lg border-t border-gray-100 bottom-nav-shadow py-3 z-50">
      <div className="flex justify-around items-center px-8">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-gray-400"
            )
          }
        >
          <div className={cn("p-2 rounded-xl transition-colors", "bg-transparent")}>
             <Home size={24} />
          </div>
          <span className="text-[10px] font-medium">发现</span>
        </NavLink>

        <NavLink
          to="/garden"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-gray-400"
            )
          }
        >
          <div className={cn("p-2 rounded-xl transition-colors", "bg-transparent")}>
            <Flower2 size={24} />
          </div>
          <span className="text-[10px] font-medium">我的花园</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-gray-400"
            )
          }
        >
          <div className={cn("p-2 rounded-xl transition-colors", "bg-transparent")}>
            <User size={24} />
          </div>
          <span className="text-[10px] font-medium">个人中心</span>
        </NavLink>
      </div>
    </nav>
  );
}
