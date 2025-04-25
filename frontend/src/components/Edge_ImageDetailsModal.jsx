/**
 * Modal getting used in V4 and V5
 */

import { X } from "lucide-react";
import { useState } from "react";

const EdgeImageDetailsModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const [showImageOnly, setShowImageOnly] = useState(false);

    const handleImageClick = () => {
        setShowImageOnly(true);
    };

    const handleCloseImageOnly = () => {
        setShowImageOnly(false);
    };

    return (
        <div className="fixed inset-0 backdrop-blur-lg backdrop-brightness-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-fadeIn">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Defect Details</h2>

                {/* Image Preview */}
                <div className="relative w-full h-[350px] rounded-lg overflow-hidden bg-gray-100 flex justify-center items-center shadow-sm">
                    <div 
                        className="cursor-pointer"
                        onClick={handleImageClick}
                    >
                        <img
                            src={data.preview}
                            alt="Preview"
                            className="max-w-full max-h-[300px] object-contain"
                        />
                    </div>
                </div>

                {/* File Name */}
                <div className="mt-4">
                    <p className="text-gray-600 text-sm">
                        <strong className="font-medium text-gray-700">File Name:</strong> {data.fileName}
                    </p>
                </div>

                {/* Time Stamp */}
                <div className="mt-4">
                    <p className="text-gray-600 text-sm">
                        <strong className="font-medium text-gray-700">Time Stamp:</strong> {new Date(data.createdTime).toLocaleString()}
                    </p>
                </div>

                {/* Defect Analysis */}
                <div className="mt-4 text-center">
                    <span className={`inline-block px-4 py-2 text-sm font-medium rounded-lg shadow-sm ${
                        data.result?.toLowerCase().includes("defective") &&
                        !data.result?.toLowerCase().includes("not defective") ||
                        data.result?.toLowerCase().includes("does not align")
                            ? "bg-red-100 text-red-700"
                            : data.result?.toLowerCase().includes("not defective")
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                    }`}>
                        {data.result ? data.result : "Classifying..."}
                    </span>
                </div>

                {/* Fullscreen Image View */}
                {showImageOnly && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50 p-4">
                        <button
                            onClick={handleCloseImageOnly}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={data.preview}
                            alt="Fullscreen Preview"
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EdgeImageDetailsModal;