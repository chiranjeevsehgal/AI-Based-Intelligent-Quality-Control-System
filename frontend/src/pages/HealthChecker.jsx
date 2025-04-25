import React, { useState } from "react";
import HealthMonitor from '../components/HealthMonitor';
import Sidebar from '../components/Sidebar';
import { Menu } from "lucide-react";

const Health = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentPage="/" />
            
            <div 
                className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}
            >
                <div className="p-6">
                <div className="flex flex-row mb-2">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="mr-4 text-gray-500 hover:text-gray-700">
                  <Menu className="h-6 w-6" />
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-800">Health Checker</h1>
            </div>
                    <HealthMonitor />
                </div>
            </div>
        </div>
    );
};

export default Health;