import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HealthMonitor = () => {
    const [services, setServices] = useState([
        { name: 'Backend API', endpoint: '/api/health', status: 'unknown', lastChecked: null },
        { name: 'Airflow', endpoint: '/api/airflow-health', status: 'unknown', lastChecked: null },
        { name: 'Kafka', endpoint: '/api/kafka-health', status: 'unknown', lastChecked: null }
        // { name: 'Ollama', endpoint: '/ollama-health', status: 'unknown', lastChecked: null },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const baseUrl = import.meta.env.VITE_API_URL;

    // Function to check health of all services at once
    const checkAllServices = async () => {
        setLoading(true);
        setError(null);

        try {
            // Get individual service statuses
            const servicePromises = services.map(async (service) => {
                try {
                    const response = await axios.get(`${service.endpoint}`, { timeout: 5000 });

                    console.log(response);
                    console.log(service);
                    if (response.status === 200) {

                        return {
                            ...service,
                            status: 'healthy',
                            lastChecked: new Date(),
                            details: response.data
                        };
                    }

                } catch (error) {
                    return {
                        ...service,
                        status: 'unhealthy',
                        lastChecked: new Date(),
                        error: error.message
                    };
                }
            });

            const updatedServices = await Promise.all(servicePromises);
            setServices(updatedServices);
        } catch (error) {
            console.error('Error checking services:', error);
            setError('Failed to check service health. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Check on initial load
    useEffect(() => {
        checkAllServices();
        // Auto-refresh every 30 seconds
        const interval = setInterval(checkAllServices, 30000);
        return () => clearInterval(interval);
    }, []);

    // Get status badge styles
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy': return 'bg-green-500';
            case 'unhealthy': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Service Health Dashboard</h1>
                <div className="flex items-center">
                    {loading && <span className="mr-2 text-sm text-gray-600">Refreshing...</span>}
                    <button
                        onClick={checkAllServices}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
                    >
                        <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {services.map((service, index) => (
                    <div key={index} className="border rounded-lg p-4 shadow hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{service.name}</h2>
                            <span className={`px-2 py-1 text-xs font-bold uppercase text-white rounded-full ${getStatusColor(service.status)}`}>
                                {service.status}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">Endpoint: {service.endpoint}</p>
                        {service.lastChecked && (
                            <p className="text-xs text-gray-500 mt-1">
                                Last checked: {service.lastChecked.toLocaleTimeString()}
                            </p>
                        )}
                        {service.status === 'unhealthy' && service.error && (
                            <p className="text-xs text-red-500 mt-1 break-words">Error: {service.error}</p>
                        )}
                        {service.status === 'healthy' && service.details && (
                            <div className="mt-2 text-xs text-gray-600">
                                <div className="p-2 bg-gray-50 rounded overflow-x-auto max-h-20">
                                    <pre>{JSON.stringify(service.details, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4 text-xs text-gray-500">
                Auto-refreshes every 30 seconds
            </div>
        </div>
    );
};

export default HealthMonitor;