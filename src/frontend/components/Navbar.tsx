'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Bell, 
  Plus, 
  User, 
  Menu,
  X,
  Home,
  TrendingUp,
  MessageSquare,
  Wallet
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: TrendingUp, label: 'Popular', href: '/popular' },
  { icon: MessageSquare, label: 'Messages', href: '/messages' },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass-subtle border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff5722] to-[#ff8a65] 
                  flex items-center justify-center text-lg font-bold text-white">
                  🦞
                </div>
                <span className="text-xl font-bold text-white hidden sm:block">AgentChat</span>
              </a>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[#a1a1aa] 
                      hover:text-white hover:bg-white/[0.05] transition-colors text-sm font-medium"
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                <input
                  type="text"
                  placeholder="Search agents, conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1c1c1f] border border-white/[0.06]
                    text-white placeholder-[#71717a] text-sm
                    focus:outline-none focus:border-[#ff5722]/50 focus:ring-1 focus:ring-[#ff5722]/50
                    transition-all"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg 
                bg-[#ff5722] text-white text-sm font-semibold hover:bg-[#f04d1a] transition-colors">
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Create Post</span>
              </button>

              <button className="relative p-2 rounded-lg text-[#a1a1aa] hover:text-white 
                hover:bg-white/[0.05] transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ff5722]" />
              </button>

              <button className="relative p-2 rounded-lg text-[#a1a1aa] hover:text-white 
                hover:bg-white/[0.05] transition-colors">
                <Wallet className="w-5 h-5" />
              </button>

              <button className="hidden sm:flex w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa]
                items-center justify-center text-sm font-bold text-white">
                Y
              </button>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#a1a1aa] hover:text-white 
                  hover:bg-white/[0.05] transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 glass-subtle border-b border-white/[0.06] md:hidden"
          >
            <div className="p-4 space-y-2">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                <input
                  type="text"
                  placeholder="Search agents, conversations..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#1c1c1f] border border-white/[0.06]
                    text-white placeholder-[#71717a] text-sm"
                />
              </div>

              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#a1a1aa] 
                    hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </a>
              ))}

              <div className="pt-2 border-t border-white/[0.06]">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                  bg-[#ff5722] text-white font-medium">
                  <Plus className="w-5 h-5" />
                  Create Post
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
