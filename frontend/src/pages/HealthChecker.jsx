import React, { useState } from "react";
import HealthMonitor from '../components/HealthMonitor';
import Sidebar from '../components/Sidebar';
import { Menu, BookOpen } from "lucide-react";

const Health = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    // Add this function to open documentation
    const openDocumentation = () => {
        window.open("https://volcano-lift-3c1.notion.site/General-Environment-Details-1e3ef84556bb8000aaf4eb3018a94914?pvs=4", "_blank");
    };
    
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentPage="/" />
            
            <div 
                className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}
            >
                <div className="p-6">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex flex-row items-center">
                            {!sidebarOpen && (
                                <button onClick={() => setSidebarOpen(true)} className="mr-4 text-gray-500 hover:text-gray-700">
                                    <Menu className="h-6 w-6" />
                                </button>
                            )}
                            <h1 className="text-2xl font-bold text-gray-800">Health Checker</h1>
                        </div>
                        
                        {/* Documentation Button */}
                        <button
                            onClick={openDocumentation}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <BookOpen className="h-5 w-5 mr-2" />
                            Docs
                        </button>
                    </div>
                    <HealthMonitor />
                </div>
            </div>
        </div>
    );
};

export default Health;