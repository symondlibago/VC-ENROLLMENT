import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Header = ({ isCollapsed, setIsCollapsed }) => {
  const [searchFocused, setSearchFocused] = useState(false);

  const headerVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  const searchVariants = {
    focused: {
      scale: 1.02,
      boxShadow: '0 10px 30px rgba(156, 38, 44, 0.1)',
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    },
    unfocused: {
      scale: 1,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      transition: {
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1]
      }
    }
  };

  return (
    <motion.header
      className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-lg bg-white/95"
      variants={headerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="lg:hidden text-gray-600 hover:text-[var(--dominant-red)] liquid-button"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Page Title */}
        <div className="hidden lg:block">
          <h2 className="text-xl font-bold heading-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Welcome back, Admin</p>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <motion.div
          className="relative"
          variants={searchVariants}
          animate={searchFocused ? 'focused' : 'unfocused'}
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students, courses, or documents..."
            className="pl-10 pr-4 py-2 w-full border-gray-200 focus:border-[var(--dominant-red)] focus:ring-[var(--dominant-red)] liquid-morph"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </motion.div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-[var(--dominant-red)] liquid-button"
        >
          <Sun className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <motion.div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-[var(--dominant-red)] liquid-button relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--dominant-red)] rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>
        </motion.div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-2 hover:bg-gray-50 liquid-button"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src="/api/placeholder/32/32" alt="Admin" />
                <AvatarFallback className="bg-[var(--dominant-red)] text-white text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@eduenroll.com</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 liquid-morph">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-50">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:bg-red-50 text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default Header;

