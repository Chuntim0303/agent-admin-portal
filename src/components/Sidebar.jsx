// src/Sidebar.jsx
import React from "react";

const Sidebar = ({ 
  navigation, 
  currentPage, 
  setCurrentPage, 
  user, 
  signOut 
}) => {
  return (
    <aside className="w-64 h-screen bg-gray-800 text-white flex flex-col fixed left-0 top-0 z-10">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>
      
      {/* Navigation - Scrollable if needed */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigation.map((page) => (
            <li key={page.id}>
              <button
                onClick={() => setCurrentPage(page.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentPage === page.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className="text-lg">{page.icon}</span>
                <span className="font-medium">{page.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        
        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;