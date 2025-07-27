'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, PenLine, History } from 'lucide-react'

export function Navigation() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }
  
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            <span className="font-semibold text-lg">绘本工坊</span>
          </Link>
          
          <nav className="flex items-center space-x-1">
            <Link 
              href="/create"
              className={`px-4 py-2 rounded-md flex items-center space-x-1 text-sm ${
                isActive('/create') 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <PenLine className="h-4 w-4" />
              <span>创作绘本</span>
            </Link>
            
            <Link 
              href="/history"
              className={`px-4 py-2 rounded-md flex items-center space-x-1 text-sm ${
                isActive('/history') 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <History className="h-4 w-4" />
              <span>历史作品</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}