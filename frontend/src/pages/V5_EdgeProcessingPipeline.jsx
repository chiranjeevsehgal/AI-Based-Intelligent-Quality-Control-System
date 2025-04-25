/**
 * Version 5
 * For the Edge Processing Implementation
 * Everything needs to be running locally except the model
 * Uses Airflow + Kafka to monitor changes in the data source(directory)
 * Uses Gemini for the analysis
 */

import React, { useState, useEffect, useRef } from "react";
import { FileImage, Check, X, Loader2, ChevronRight, ExternalLink, RefreshCw, AlertCircle, Menu, Info } from "lucide-react";
import Sidebar from "../components/Sidebar";
import EdgeImageDetailsModal from "../components/Edge_ImageDetailsModal";

const EdgeDefectCheckerPipeline_Kafka = () => {
    const [result, setResult] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [ws, setWs] = useState(null);
    const [previewSrc, setPreviewSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [processingStages, setProcessingStages] = useState({
        websocket: null,
        preview: null,
        analysis: null
    });
    const [imageQueue, setImageQueue] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [noteVisible, setNoteVisible] = useState(true);
    const [currentProcessingId, setCurrentProcessingId] = useState(null);

    const isProcessingRef = useRef(false);

    const openModal = (image) => {
        setSelectedImage({
            ...image,
            preview: image.preview
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedImage(null);
        setIsModalOpen(false);
    };

    const openFullscreenImage = (image) => {
        setFullscreenImage(image.preview);
    };

    const closeFullscreenImage = () => {
        setFullscreenImage(null);
    };

    const updateStage = (stage, status) => {
        setProcessingStages(prev => ({
            ...prev,
            [stage]: status
        }));
    };

    // WebSocket connection setup
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:5001/api/ws");

        socket.onopen = () => {
            console.log("WebSocket connected");
            setConnectionStatus("connected");
            setWs(socket);
            updateStage('websocket', true);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Message from server:", data);

            if (data.type === "LOCAL_FILE_RESULT" && data.data.previewData) {
                setImageQueue(prevQueue => {
                    const newImage = {
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        filePath: data.data.filePath,
                        fileName: data.data.fileName,
                        createdTime: data.data.timestamp || new Date().toISOString(),
                        status: 'pending',
                        preview: data.data.previewData,
                        result: null,
                        isCurrent: false,
                        source: 'local'
                    };

                    const existingPaths = new Set(prevQueue.map(img => img.filePath));
                    if (!existingPaths.has(newImage.filePath)) {
                        return [...prevQueue, newImage];
                    }
                    return prevQueue;
                });
            }
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            setConnectionStatus("disconnected");
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            setConnectionStatus("error");
        };

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    // Image processing pipeline
    useEffect(() => {
        const processNextImage = async () => {
            if (isProcessingRef.current) return;

            const nextImageIndex = imageQueue.findIndex(img => img.status === 'pending');
            if (nextImageIndex === -1) {
                isProcessingRef.current = false;
                return;
            }

            isProcessingRef.current = true;
            const imageToProcess = imageQueue[nextImageIndex];

            // Set the current processing ID and preview
            setCurrentProcessingId(imageToProcess.id);
            setPreviewSrc(imageToProcess.preview);

            setImageQueue(prevQueue =>
                prevQueue.map((img, idx) =>
                    idx === nextImageIndex
                        ? { ...img, status: 'processing', isCurrent: true }
                        : { ...img, isCurrent: false }
                )
            );

            try {
                updateStage('preview', null);
                updateStage('analysis', null);
                setResult(null);

                updateStage('preview', true);

                const cachedResult = localStorage.getItem(imageToProcess.filePath);
                if (cachedResult) {
                    console.log("Using cached result:", cachedResult);
                    setResult(cachedResult);
                    setImageQueue(prevQueue =>
                        prevQueue.map((img, idx) =>
                            idx === nextImageIndex ? { ...img, status: 'completed', result: cachedResult } : img
                        )
                    );
                    updateStage('analysis', true);
                    isProcessingRef.current = false;
                    setCurrentProcessingId(null);
                    return;
                }

                // Backend url, where image processing will occur
                const analysisResponse = await fetch(`/api/process-image`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        imageData: imageToProcess.preview.split(',')[1],
                        filePath: imageToProcess.filePath
                    }),
                });

                const analysisResult = await analysisResponse.json();
                const resultText = analysisResult.result || "Error";

                setResult(resultText);
                localStorage.setItem(imageToProcess.filePath, resultText);
                setImageQueue(prevQueue =>
                    prevQueue.map((img, idx) =>
                        idx === nextImageIndex ? { ...img, status: 'completed', result: resultText } : img
                    )
                );
                updateStage('analysis', true);

            } catch (error) {
                console.error("Error processing image:", error);
                setResult("Error occurred");
                setImageQueue(prevQueue =>
                    prevQueue.map((img, idx) =>
                        idx === nextImageIndex ? { ...img, status: 'failed', result: "Error occurred" } : img
                    )
                );
                updateStage('analysis', false);
            } finally {
                isProcessingRef.current = false;
                setCurrentProcessingId(null);
            }
        };

        if (!isProcessingRef.current && imageQueue.some(img => img.status === 'pending')) {
            processNextImage();
        }
    }, [imageQueue]);

    // Keep showing the preview of the currently processing image
    useEffect(() => {
        if (currentProcessingId) {
            const currentImage = imageQueue.find(img => img.id === currentProcessingId);
            if (currentImage) {
                setPreviewSrc(currentImage.preview);
            }
        }
    }, [currentProcessingId, imageQueue]);

    // Status display components
    const ProcessStage = ({ name, status }) => {
        if (status === null) {
            return (
                <div className="flex items-center space-x-3 mb-2">
                    <div className="rounded-full p-1 bg-gray-200">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-500">{name}</span>
                </div>
            );
        }

        const icon = status ?
            <Check className="w-5 h-5 text-white" /> :
            <X className="w-5 h-5 text-white" />;

        const bgColor = status ? "bg-green-500" : "bg-red-500";
        const textColor = status ? "text-green-500" : "text-red-500";

        return (
            <div className="flex items-center space-x-3 mb-2">
                <div className={`rounded-full p-1 ${bgColor}`}>
                    {icon}
                </div>
                <span className={`font-medium ${textColor}`}>{name}</span>
            </div>
        );
    };

    const StatusBadge = ({ status }) => {
        const statusMap = {
            pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            processing: { color: 'bg-blue-100 text-blue-800', text: 'Processing' },
            completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
            failed: { color: 'bg-red-100 text-red-800', text: 'Failed' }
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[status]?.color || 'bg-gray-100 text-gray-800'}`}>
                {statusMap[status]?.text || status}
            </span>
        );
    };

    const resetAllStates = () => {
        setResult(null);
        setPreviewSrc(null);
        setIsLoading(false);
        setImageQueue([]);
        setFullscreenImage(null);
        setCurrentProcessingId(null);

        if (connectionStatus !== "connected") {
            setProcessingStages({
                websocket: null,
                preview: null,
                analysis: null
            });
        } else {
            setProcessingStages({
                websocket: true,
                preview: null,
                analysis: null
            });
        }

        localStorage.clear();
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                currentPage="/edgepipeline1"
            />

            <div
                className={`flex-1 transition-all duration-300 ease-in-out 
          ${sidebarOpen ? "md:ml-64" : "md:ml-20"}
          p-4 sm:p-6 overflow-y-auto`}
            >
                <div className="max-w-8xl mx-auto flex flex-col">

                    <div className="mb-4 flex flex-row items-center">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="mr-4 text-gray-500 hover:text-gray-700"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        )}
                        <div className="flex justify-between items-center w-full">
                            <h1 className="text-2xl font-bold text-gray-800">Defect Analyzer - Edge (Using Airflow + Kafka)</h1>
                            <button
                                onClick={resetAllStates}
                                className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                                <RefreshCw className="h-5 w-5 mr-2" />
                                Reset All
                            </button>
                        </div>
                    </div>
                    {/* Informative Note Box */}
                    {noteVisible && (
                        <div
                            className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg mb-6 p-4 relative"
                        >
                            <button
                                onClick={() => setNoteVisible(false)}
                                className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="flex flex-col sm:flex-row items-start pr-8">
                                <Info className="h-6 w-6 mb-2 sm:mb-0 sm:mr-3 flex-shrink-0 text-blue-600" />
                                <div>
                                    <h3 className="font-semibold mb-2 text-blue-800">Automated Defect Detection Process - Edge Implementation</h3>
                                    <ul className="list-disc list-inside mt-2 text-sm">
                                        <li>This demonstration uses Airflow and Kafka to monitor files in a local input directory.</li>
                                        <li>When a file is added or modified, the system detects the change and extracts metadata.</li>
                                        <li>The metadata is then passed to the processing module, which analyzes the file using <span className="font-bold">Gemini</span>.</li>

                                    </ul>

                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Preview - Left Side */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">Current Image Preview</h2>
                        <div className="border-dashed border-2 border-gray-300 rounded-lg h-96 flex items-center justify-center">
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                                </div>
                            ) : (
                                previewSrc ? (
                                    <div
                                        className="cursor-pointer w-full h-full flex items-center justify-center"
                                        onClick={() => setFullscreenImage(previewSrc)}
                                    >
                                        <img
                                            src={previewSrc}
                                            alt="Preview"
                                            className="max-h-full max-w-full object-contain"
                                            onLoad={() => console.log("✅ Image loaded successfully!")}
                                            onError={(e) => {
                                                console.error("Error loading image:", e);
                                                setPreviewSrc(null);
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Waiting for image...</p>
                                )
                            )}
                        </div>
                    </div>

                    {/* Processing Stages and Defect Analysis - Right Side */}
                    <div className="space-y-6">
                        {/* Processing Stages */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">Processing Stages</h2>
                            <ProcessStage name="WebSocket Connection" status={processingStages.websocket} />
                            <ProcessStage name="Image Preview" status={processingStages.preview} />
                            <ProcessStage name="Defect Analysis" status={processingStages.analysis} />
                        </div>

                        {/* Analysis Results */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">Current Analysis Results</h2>
                            {result ? (
                                <div className={`p-4 rounded-lg 
                                    ${result.toLowerCase().includes("defective") &&
                                        !result.toLowerCase().includes("not defective") ||
                                        result.toLowerCase().includes("does not align")
                                        ? "bg-red-50 text-red-700"
                                        : result.toLowerCase().includes("not defective")
                                            ? "bg-green-50 text-green-700"
                                            : "bg-gray-50 text-gray-700"}`}>
                                    <p className="text-sm font-medium">{result}</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                                    <FileImage className="h-12 w-12 text-gray-300 mb-3" />
                                    <p className="text-center">Waiting for image analysis</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Image Queue Table */}
                <div className="mt-8 bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-medium text-gray-800 mb-4">
                        <p>Image Processing Queue ({imageQueue.length})
                            {imageQueue.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-500 ">
                                    {imageQueue.filter(img => img.status === 'completed').length} completed •
                                    {imageQueue.filter(img => img.status === 'processing').length} processing •
                                    {imageQueue.filter(img => img.status === 'pending').length} pending
                                </span>
                            )}
                        </p>
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Defect Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {imageQueue.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                            No images in queue
                                        </td>
                                    </tr>
                                ) : (
                                    imageQueue.map((image, index) => (
                                        <tr
                                            key={image.id}
                                            className={`
                                                ${image.isCurrent ? 'bg-blue-50' : ''} 
                                                ${image.status === 'failed' ? 'bg-red-50' : ''}
                                                hover:bg-gray-50
                                            `}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={image.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs">
                                                <div
                                                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center cursor-pointer"
                                                    onClick={() => openFullscreenImage(image)}
                                                >
                                                    {image.fileName}
                                                    <ExternalLink className="ml-1 h-4 w-4" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(image.createdTime).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {image.result ? (
                                                    image.result.toLowerCase().includes('invalid') ||
                                                        image.result.toLowerCase().includes('does not align') ? (
                                                        <div className="flex items-center text-gray-500 p-2 rounded-md">
                                                            <AlertCircle className="h-5 w-5 mr-1" />
                                                            <span>Invalid</span>
                                                        </div>
                                                    ) : image.result.toLowerCase().includes('not defective') ? (
                                                        <div className="flex items-center text-green-500 p-2 rounded-md">
                                                            <Check className="h-5 w-5 mr-1" />
                                                            <span>Not Defective</span>
                                                        </div>
                                                    ) : image.result.toLowerCase().includes('defective') ? (
                                                        <div className="flex items-center text-red-500 p-2 rounded-md">
                                                            <X className="h-5 w-5 mr-1" />
                                                            <span>Defective</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-gray-500 p-2 rounded-md">
                                                            <AlertCircle className="h-5 w-5 mr-1" />
                                                            <span>Unknown</span>
                                                        </div>
                                                    )
                                                ) : (
                                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                                )}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    className="text-blue-500 hover:text-blue-700 flex items-center"
                                                    onClick={() => openModal(image)}
                                                >
                                                    Details <ChevronRight className="h-4 w-4 ml-1" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Image Details Modal */}
            <EdgeImageDetailsModal
                isOpen={isModalOpen}
                onClose={closeModal}
                data={selectedImage}
            />

            {/* Fullscreen Image View */}
            {fullscreenImage && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
                    <button
                        onClick={closeFullscreenImage}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={fullscreenImage}
                        alt="Fullscreen Preview"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
};

export default EdgeDefectCheckerPipeline_Kafka;