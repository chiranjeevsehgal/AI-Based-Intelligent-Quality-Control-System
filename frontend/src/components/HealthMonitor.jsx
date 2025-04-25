import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';

const HealthMonitor = () => {
    const getStoredSetting = (key, defaultValue) => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return defaultValue;
        }
    };

    const [services, setServices] = useState([
        { name: 'Backend API', endpoint: '/api/health', status: 'unknown', lastChecked: null },
        { name: 'Airflow', endpoint: '/api/airflow-health', status: 'unknown', lastChecked: null },
        { name: 'Kafka', endpoint: '/api/kafka-health', status: 'unknown', lastChecked: null }
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(getStoredSetting('healthMonitor_autoRefresh', false));
    const [refreshInterval, setRefreshInterval] = useState(getStoredSetting('healthMonitor_refreshInterval', 30));
    const intervalRef = useRef(null);

    // Function to check health of all services
    const checkAllServices = async () => {
        setLoading(true);
        setError(null);

        try {
            const servicePromises = services.map(async (service) => {
                try {
                    const response = await axios.get(`${service.endpoint}`, { timeout: 5000 });
                    return {
                        ...service,
                        status: 'healthy',
                        lastChecked: new Date(),
                        details: response.data
                    };
                } catch (error) {
                    return {
                        ...service,
                        status: 'unhealthy',
                        lastChecked: new Date()
                    };
                }
            });

            const updatedServices = await Promise.all(servicePromises);
            setServices(updatedServices);
        } catch (error) {
            setError('Could not check services. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Toggle auto-refresh and save to localStorage
    const toggleAutoRefresh = () => {
        const newState = !autoRefresh;
        setAutoRefresh(newState);
        localStorage.setItem('healthMonitor_autoRefresh', JSON.stringify(newState));
        
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        
        if (newState) {
            intervalRef.current = setInterval(checkAllServices, refreshInterval * 1000);
        }
    };

    const handleIntervalChange = (seconds) => {
        setRefreshInterval(seconds);
        localStorage.setItem('healthMonitor_refreshInterval', JSON.stringify(seconds));
        
        if (autoRefresh && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(checkAllServices, seconds * 1000);
        }
    };

    // Set up auto-refresh based on stored settings
    useEffect(() => {
        checkAllServices();
        
        if (autoRefresh) {
            intervalRef.current = setInterval(checkAllServices, refreshInterval * 1000);
        }
        
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Calculate overall system status
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const systemStatus = healthyCount === services.length ? 'All Systems Operational' :
                        healthyCount === 0 ? 'All Systems are Down' : 'Some Systems are Down';
    
    // Status indicators
    const StatusIndicator = ({ status }) => {
        if (status === 'healthy') {
            return <div className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2" />Operational</div>;
        } else if (status === 'unhealthy') {
            return <div className="flex items-center"><XCircle className="h-5 w-5 text-red-500 mr-2" />Down</div>;
        }
        return <div className="flex items-center"><Clock className="h-5 w-5 text-gray-500 mr-2" />Checking...</div>;
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-800">System Status</h1>
                    <p className={`mt-1 font-medium ${
                        systemStatus === 'All Systems Operational' ? 'text-green-600' :
                        systemStatus === 'All Systems are Down' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                        {systemStatus}
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={checkAllServices}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Auto-refresh Controls */}
            <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                    <button 
                        onClick={toggleAutoRefresh}
                        className="flex items-center text-gray-800 font-medium"
                    >
                        {autoRefresh ? (
                            <ToggleRight className="h-6 w-6 text-blue-500 mr-2" />
                        ) : (
                            <ToggleLeft className="h-6 w-6 text-gray-400 mr-2" />
                        )}
                        Auto Refresh
                    </button>
                    
                    {autoRefresh && (
                        <span className="text-sm text-gray-500 ml-2">
                            Every {refreshInterval} seconds
                        </span>
                    )}
                </div>
                
                {autoRefresh && (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Interval:</span>
                        {[20, 30, 40, 50].map((seconds) => (
                            <button
                                key={seconds}
                                onClick={() => handleIntervalChange(seconds)}
                                className={`px-2 py-1 text-xs rounded ${
                                    refreshInterval === seconds
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                {seconds}s
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                </div>
            )}

            {/* Status Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                {services.map((service, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow transition">
                        <h2 className="text-lg font-medium text-gray-800 mb-2">{service.name}</h2>
                        <StatusIndicator status={service.status} />
                        
                        {service.lastChecked && (
                            <div className="mt-2 text-xs text-gray-500">
                                Last checked: {service.lastChecked.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HealthMonitor;