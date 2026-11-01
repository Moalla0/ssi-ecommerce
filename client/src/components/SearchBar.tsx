"use client";

import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import SearchModal from "./SearchModal";

const SearchBar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle keyboard shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleClose = () => {
    setIsSearchOpen(false);
  };

  return (
    <>
      {/* Desktop Search Bar */}
      <div 
        className='hidden sm:flex items-center gap-2 rounded-md ring-1 ring-gray-200 px-2 py-1 shadow-md cursor-pointer hover:ring-gray-300 transition-colors'
        onClick={handleSearchClick}
      >
        <Search className="w-4 h-4 text-gray-500"/>
        <input 
          id="search" 
          placeholder="Search..." 
          className="text-sm outline-0 cursor-pointer bg-transparent"
          readOnly
        />
        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">
          ⌘K
        </kbd>
      </div>

      {/* Mobile Search Icon */}
      <button
        className="sm:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
        onClick={handleSearchClick}
        title="Search"
      >
        <Search className="w-4 h-4 text-gray-600" />
      </button>
      
      <SearchModal isOpen={isSearchOpen} onClose={handleClose} />
    </>
  );
};

export default SearchBar;