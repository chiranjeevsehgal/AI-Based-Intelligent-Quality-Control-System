/**
 * Version 3
 * For the Cloud Implementation using Google Drive
 * Uses Google App Script to monitor changes in the data source (Google Drive)
 */

import React, { useState, useEffect, useRef } from "react";
import { FileImage, Check, X, Loader2, ChevronRight, ExternalLink, RefreshCw, AlertCircle, Menu, Info, BookOpen  } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ImageDetailsModal from "../components/ImageDetailsModal";

const CloudDefectCheckerPipeline = () => {

    const [result, setResult] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState("disconnected");
    const [ws, setWs] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
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
    const [noteVisible, setNoteVisible] = useState(true);

    const isProcessingRef = useRef(false);

    const openModal = (image) => {
        setSelectedImage(image);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedImage(null);
        setIsModalOpen(false);
    };

    const updateStage = (stage, status) => {
        setProcessingStages(prev => ({
            ...prev,
            [stage]: status
        }));
    };

    // WebSocket connection setup
    useEffect(() => {
        // Backend url, where Web socket is initialized, a deployed url, because for the google appscript cloud setup, it expects a deployed backend
        const socket = new WebSocket("wss://intelligent-quality-control-system-pilot.onrender.com/api/ws");
    
        socket.onopen = () => {
            console.log("WebSocket connected");
            setConnectionStatus("connected");
            setWs(socket);
            updateStage('websocket', true);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Message from server:", data);

            // Handles multiple files
            if (Array.isArray(data)) {
                // Add new images to queue
                setImageQueue(prevQueue => {
                    const newImages = data.map(file => ({
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        url: file.fileUrl,
                        fileName: file.fileName || file.fileUrl.split('/').pop(),
                        createdTime: file.createdTime || new Date().toISOString(),
                        status: 'pending',
                        preview: null,
                        result: null,
                        isCurrent: false
                    }));

                    // To filter out duplicates
                    const existingUrls = new Set(prevQueue.map(img => img.url));
                    const filteredNewImages = newImages.filter(img => !existingUrls.has(img.url));

                    return [...prevQueue, ...filteredNewImages];
                });
            } else if (data.fileUrl) {
                // Handle single file
                setImageQueue(prevQueue => {
                    if (prevQueue.some(img => img.url === data.fileUrl)) {
                        return prevQueue; // Skip if already exists
                    }

                    return [...prevQueue, {
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        url: data.fileUrl,
                        fileName: data.fileName || data.fileUrl.split('/').pop(),
                        createdTime: data.createdTime || new Date().toISOString(),
                        status: 'pending',
                        preview: null,
                        result: null,
                        isCurrent: false
                    }];
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

            setImageQueue(prevQueue =>
                prevQueue.map((img, idx) =>
                    idx === nextImageIndex
                        ? { ...img, status: 'processing', isCurrent: true }
                        : { ...img, isCurrent: false }
                )
            );

            try {
                setFileUrl(imageToProcess.url);
                updateStage('preview', null);
                updateStage('analysis', null);
                setResult(null);

                const fileId = extractFileId(imageToProcess.url);
                if (!fileId) throw new Error('Invalid Google Drive URL');

                /** 
                 * Backend url, where image processing will occur
                 * It has to be hosted, as Google AppScript requires, the webhook to be in a hosted environment 
                 * */
                const previewResponse = await fetch(`https://intelligent-quality-control-system-pilot.onrender.com/api/drive/get-image?fileId=${fileId}`);
                const { data: previewData } = await previewResponse.json();

                setImageQueue(prevQueue =>
                    prevQueue.map((img, idx) =>
                        idx === nextImageIndex ? { ...img, preview: previewData } : img
                    )
                );
                setPreviewSrc(previewData);
                updateStage('preview', true);

                const cachedResult = localStorage.getItem(imageToProcess.url);
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
                    return;
                }

                // Calling backend for the image analysis
                const base64Data = previewData;
                const analysisResponse = await fetch('https://intelligent-quality-control-system-pilot.onrender.com/api/analyze-image', {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageData: base64Data }),
                });

                const analysisResult = await analysisResponse.json();
                const resultText = analysisResult.result || "Error";

                setResult(resultText);
                localStorage.setItem(imageToProcess.url, resultText);
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
            }
        };

        // Process next image if not currently processing
        if (!isProcessingRef.current) {
            processNextImage();
        }
    }, [imageQueue]);

    // To extract file ID from Google Drive URL
    const extractFileId = (url) => {
        const match = url.match(/\/file\/d\/([^/]+)/);
        return match ? match[1] : null;
    };

    // Updating the processing stage status display
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

    // Updating the status display badges
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

    // To reset all the states
    const resetAllStates = () => {
        setResult(null);
        setFileUrl(null);
        setPreviewSrc(null);
        setIsLoading(false);
        setImageQueue([]);

        // Preserve WebSocket connection status if connected
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

    const openDocumentation = () => {
        window.open("https://volcano-lift-3c1.notion.site/V3-Cloud-Processing-1e2ef84556bb8050b8e0fe67688b3dff", "_blank");
    };
    


    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                currentPage="/cloudpipeline"
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
                            <h1 className="text-2xl font-bold text-gray-800">Defect Analyzer - Cloud</h1>
                            <div className="flex space-x-3">
                                {/* Documentation Button */}
                                <button
                                    onClick={openDocumentation}
                                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                    <BookOpen className="h-5 w-5 mr-2" />
                                    Docs
                                </button>
                                {/* Reset Button */}
                                <button
                                    onClick={resetAllStates}
                                    className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                >
                                    <RefreshCw className="h-5 w-5 mr-2" />
                                    Reset All
                                </button>
                            </div>
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
                                    <h3 className="font-semibold mb-2 text-blue-800">Automated Defect Detection Process - Cloud Implementation</h3>
                                    <ul className="list-disc list-inside mt-2 text-sm">
                                        <li>This demonstration leverages <span className="font-bold">Google App Script</span> to monitor changes in the data source (Google Drive).</li>
                                        <li>When new files are detected, App Script triggers an execution that notifies and sends the file metadata to the backend via a <span className="font-bold">WebHook</span> implementation.</li>
                                        <li>The metadata is then passed to the processing module, which analyzes the file using <span className="font-bold">Gemini</span>.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Two-column layout for preview and results */}
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
                                    previewSrc.startsWith('data:image') ? (
                                        <img
                                            src={previewSrc}
                                            alt="Preview"
                                            className="max-h-full max-w-full object-contain"
                                            onError={() => setPreviewSrc(fileUrl)}
                                        />
                                    ) : (
                                        <div className="text-center">
                                            <p>Direct preview unavailable</p>
                                            <a href={previewSrc} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                                View image
                                            </a>
                                        </div>
                                    )
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
                        <p>  Image Processing Queue ({imageQueue.length})
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
                                                <a
                                                    href={image.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                                                    title={image.url}
                                                >
                                                    {image.fileName}
                                                    <ExternalLink className="ml-1 h-4 w-4" />
                                                </a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(image.createdTime).toLocaleTimeString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {image.result ? (
                                                    image.result.toLowerCase().includes('defective') &&
                                                        !image.result.toLowerCase().includes('not defective') ? (
                                                        <div className="flex items-center text-red-500 p-2 rounded-md">
                                                            <X className="h-5 w-5 mr-1" />
                                                            <span>Defective</span>
                                                        </div>
                                                    ) : image.result.toLowerCase().includes('not defective') ||
                                                        !image.result.toLowerCase().includes('does not align') ? (
                                                        <div className="flex items-center text-green-500 p-2 rounded-md">
                                                            <Check className="h-5 w-5 mr-1" />
                                                            <span>Not Defective</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-gray-500 p-2 rounded-md">
                                                            <AlertCircle className="h-5 w-5 mr-1" />
                                                            <span>Invalid</span>
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
            <ImageDetailsModal
                isOpen={isModalOpen}
                onClose={closeModal}
                data={selectedImage}
                img={previewSrc}
            />
        </div>
    );
};

export default CloudDefectCheckerPipeline;