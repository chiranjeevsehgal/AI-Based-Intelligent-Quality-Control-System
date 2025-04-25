import React, { useState } from "react";
import HealthMonitor from '../components/HealthMonitor';
import Sidebar from '../components/Sidebar';

const Health = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentPage="/health" />
            <HealthMonitor />
        </div>
    );
};

export default Health;