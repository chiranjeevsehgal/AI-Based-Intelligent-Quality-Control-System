/**
 * Version 5
 * For the Edge Processing Implementation
 * Everything needs to be running locally except the model
 * Uses Airflow + Kafka to monitor changes in the data source(directory)
 * Uses Yolo V8 for the analysis
 */

import React, { useState, useEffect, useRef } from "react";
import { FileImage, Check, X, Loader2, ChevronRight, ExternalLink, RefreshCw, AlertCircle, Menu, Info, Maximize2, BookOpen } from "lucide-react";
import Sidebar from "../components/Sidebar";
import EdgeImageDetailsModal_Custom from "../components/Edge_ImageDetailsModal_Custom";

const EdgeDefectCheckerPipeline_Custom = () => {
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
    const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

    // Custom
    const [defects, setDefects] = useState([]);
    const [imageData, setImageData] = useState(null);
    const previewContainerRef = useRef(null);

    const [originalImage, setOriginalImage] = useState(null);


    const [currentFile, setCurrentFile] = useState(null);
    const currentFileRef = useRef(null);




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

    const togglePreviewFullscreen = () => {
        setIsPreviewFullscreen(!isPreviewFullscreen);
    };

    const updateStage = (stage, status) => {
        setProcessingStages(prev => ({
            ...prev,
            [stage]: status
        }));
    };

    const setCurrentFileTracked = (filePath) => {
        setCurrentFile(filePath);
        currentFileRef.current = filePath;
    };

    // WebSocket connection setup
    useEffect(() => {
        // Backend url, where Web socket is initialized
        const socket = new WebSocket((`${import.meta.env.VITE_WEB_SOCKET_URL}`));

        socket.onopen = () => {
            console.log("WebSocket connected");
            setConnectionStatus("connected");
            setWs(socket);
            updateStage('websocket', true);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Message from server:", data);

            if (data?.result?.annotatedImage) {
                setImageData(data.result.annotatedImage);
            }



            if (data.type === "ORIGINAL" && data.data.previewData) {
                resetforNext()
                setOriginalImage(data.data.previewData);
                setCurrentFileTracked(data.data.filePath);
                updateStage('preview', true);
            }

            if (data.type === "LOCAL_FILE_RESULT" && data.data.annotated) {

                if (currentFileRef.current === data.data.filePath) {
                    setPreviewSrc(data.data.annotated);
                    updateStage('analysis', true);
                    setDefects(data.data.defects);

                }
                setImageQueue(prevQueue => {
                    const newImage = {
                        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        filePath: data.data.filePath,
                        fileName: data.data.fileName,
                        createdTime: data.data.timestamp || new Date().toISOString(),
                        status: 'completed',
                        preview: data.data.previewData,
                        defects: data.data.defects,
                        annotated: data.data.annotated,
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

    const resetAllStates = () => {
        setResult(null);
        setPreviewSrc(null);
        setOriginalImage(null)
        setIsLoading(false);
        setImageQueue([]);
        setFullscreenImage(null);
        setDefects([]);
        setImageData(null);
        setIsPreviewFullscreen(false);

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

    const resetforNext = () => {
        setResult(null);
        setPreviewSrc(null);
        setIsLoading(false);
        setDefects([]);
        setImageData(null);
        setProcessingStages({
            websocket: true,
            preview: true,
            analysis: null
        });

    };

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

    // Group defects by type for the summary
    const defectSummary = defects.reduce((acc, defect) => {
        if (!acc[defect.class]) {
            acc[defect.class] = 0;
        }
        acc[defect.class]++;
        return acc;
    }, {});

    const openDocumentation = () => {
        window.open("https://volcano-lift-3c1.notion.site/V6-YoloV8-Pipeline-using-Airflow-Kafka-1e2ef84556bb80cc8417d6cd3d4e2e21", "_blank");
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-50">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                currentPage="/edgepipeline2"
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

                    {noteVisible && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg mb-6 p-4 relative">
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
                                        <li>The metadata is then passed to the processing module, which analyzes the file using <span className="font-bold">Yolo V8 Model</span>.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image Preview - Full Section with Original & Annotated */}
                    <div className={`bg-white rounded-lg shadow p-4 ${isPreviewFullscreen ? 'fixed inset-0 z-40 m-0 p-6 bg-white' : ''}`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-800">Current Image Preview</h2>
                            <div className="flex space-x-2">
                                {(originalImage || previewSrc) && (
                                    <button
                                        onClick={togglePreviewFullscreen}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                        title={isPreviewFullscreen ? "Exit fullscreen" : "View fullscreen"}
                                    >
                                        <Maximize2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div
                            ref={previewContainerRef}
                            className="flex flex-col md:flex-row gap-4 justify-center items-center border-dashed border-2 border-gray-300 rounded-lg p-2 overflow-hidden"
                            style={isPreviewFullscreen ? { height: 'calc(100vh - 120px)' } : {}}
                        >
                            {/* Original Image */}
                            <div className="flex-1 w-full h-96 flex flex-col items-center justify-center relative border rounded-lg p-2 bg-gray-50 overflow-hidden border-gray-300">
                                <div className="absolute top-2 left-2 bg-white px-2 py-0.5 text-sm text-gray-700 z-10 rounded shadow">
                                    Original Image
                                </div>
                                <div className="w-full h-full flex items-center justify-center">
                                    {originalImage ? (
                                        <img
                                            src={originalImage}
                                            alt="Original"
                                            className="max-w-full max-h-full object-contain"
                                            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90%' }}
                                        />
                                    ) : (
                                        <div className="text-gray-500 flex flex-col items-center">
                                            <FileImage className="h-12 w-12 mb-2" />
                                            <p>Waiting for original image...</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detected Defects */}
                            <div className="flex-1 w-full h-96 flex flex-col items-center justify-center relative border rounded-lg p-2 bg-gray-50 overflow-hidden border-gray-300">
                                <div className="absolute top-2 left-2 bg-white px-2 py-0.5 text-sm text-gray-700 z-10 rounded shadow">
                                    Analyzed Image
                                </div>
                                <div className="w-full h-full flex items-center justify-center">
                                    {previewSrc ? (
                                        <img
                                            src={previewSrc}
                                            alt="Detected"
                                            className="max-w-full max-h-full object-contain"
                                            style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: '90%' }}
                                        />
                                    ) : (
                                        <div className="text-gray-500 flex flex-col items-center">
                                            <FileImage className="h-12 w-12 mb-2" />
                                            <p>Awaiting processed result...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>



                    {/* Processing Stages and Defect Analysis - Right Side */}
                    {!isPreviewFullscreen && (
                        <div className="space-y-6">
                            {/* Processing Stages */}
                            <div className="bg-white rounded-lg shadow p-4">
                                <h2 className="text-lg font-medium text-gray-800 mb-4">Processing Stages</h2>
                                <ProcessStage name="WebSocket Connection" status={processingStages.websocket} />
                                <ProcessStage name="Image Preview" status={processingStages.preview} />
                                <ProcessStage name="Defect Analysis" status={processingStages.analysis} />
                            </div>

                            {/* Defect Summary */}
                            <div className="bg-white rounded-lg shadow p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-medium text-gray-800">Defect Summary</h2>
                                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                        {defects.length} defects found
                                    </span>
                                </div>

                                {defects.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            {Object.entries(defectSummary).map(([type, count]) => (
                                                <div key={type} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                                    <div className={`w-3 h-3 rounded-full mr-2 ${type === 'burnt' ? 'bg-[rgb(255,0,0)]' :
                                                        type === 'fold' ? 'bg-[rgb(0,0,255)]' :
                                                            type === 'pen' ? 'bg-[rgb(255,0,255)]' :
                                                                type === 'tear' ? 'bg-[rgb(128,0,128)]' :
                                                                    type === 'marker' ? 'bg-[rgb(255,255,0)]' :
                                                                        type === 'cut' ? 'bg-[rgb(0,255,0)]' :
                                                                            type === 'stain' ? 'bg-[rgb(0,255,255)]' : 'bg-yellow-500'
                                                        }`}></div>
                                                    <span className="font-medium text-gray-700 capitalize">{type}</span>
                                                    <span className="ml-auto bg-white px-2 py-1 rounded text-sm font-semibold">{count}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t pt-4">
                                            <h3 className="font-medium text-gray-700 mb-3">Defect Details</h3>
                                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                                {defects.map((defect, index) => (
                                                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center">
                                                            <div className={`w-2 h-2 rounded-full mr-2 ${defect.class === 'burnt' ? 'bg-[rgb(255,0,0)]' :
                                                                defect.class === 'fold' ? 'bg-[rgb(0,0,255)]' :
                                                                    defect.class === 'pen' ? 'bg-[rgb(255,0,255)]' :
                                                                        defect.class === 'tear' ? 'bg-[rgb(128,0,128)]' :
                                                                            defect.class === 'marker' ? 'bg-[rgb(255,255,0)]' :
                                                                                defect.class === 'cut' ? 'bg-[rgb(0,255,0)]' :
                                                                                    defect.class === 'stain' ? 'bg-[rgb(0,255,255)]' : 'bg-yellow-500'
                                                                }`}></div>
                                                            <span className="font-medium text-gray-700 capitalize">{defect.class}</span>
                                                            <span className="ml-auto text-sm text-gray-500">
                                                                Confidence: {(defect.confidence * 100).toFixed(2)}%
                                                            </span>
                                                        </div>
                                                        <div className="mt-1 text-sm text-gray-500">
                                                            Location: ({defect.bbox[0].toFixed(2)}, {defect.bbox[1].toFixed(2)})
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        {imageData ? "No defects detected" : "No image analyzed yet"}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Queue Table */}
                {!isPreviewFullscreen && (
                    <div className="mt-8 bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-medium text-gray-800 mb-4">
                            Image Processing Queue ({imageQueue.length})
                            {imageQueue.length > 0 && (
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    {imageQueue.filter(img => img.status === 'completed').length} completed •
                                    {imageQueue.filter(img => img.status === 'processing').length} processing •
                                    {imageQueue.filter(img => img.status === 'pending').length} pending
                                </span>
                            )}
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
                                                    {/* {defects ? ( */}
                                                    {image.defects ? (
                                                        // image.result.toLowerCase().includes('invalid') ||
                                                        //     image.result.toLowerCase().includes('does not align') ? (
                                                        //     <div className="flex items-center text-gray-500 p-2 rounded-md">
                                                        //         <AlertCircle className="h-5 w-5 mr-1" />
                                                        //         <span>Invalid</span>
                                                        //     </div>
                                                        // ) : (defects.length == 0) ? (
                                                        (image.defects.length == 0) ? (
                                                            <div className="flex items-center text-green-500 p-2 rounded-md">
                                                                <Check className="h-5 w-5 mr-1" />
                                                                <span>Not Defective</span>
                                                            </div>
                                                        ) : (image.defects.length > 0) ? (
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
                )}
            </div>

            {/* Image Details Modal */}
            <EdgeImageDetailsModal_Custom
                isOpen={isModalOpen}
                onClose={closeModal}
                data={selectedImage}
                defects={defects}
                annotated_image={imageData}
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

export default EdgeDefectCheckerPipeline_Custom;