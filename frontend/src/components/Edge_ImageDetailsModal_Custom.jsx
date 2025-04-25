/**
 * Modal getting used in V6
 */

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const EdgeImageDetailsModal_Custom = ({ isOpen, onClose, data, defects, annotated_image }) => {
    if (!isOpen || !data) return null;

    const [showImageOnly, setShowImageOnly] = useState(null); // null | 'original' | 'detected'

    const handleImageClick = (type) => {
        setShowImageOnly(type);
    };

    const handleCloseImageOnly = () => {
        setShowImageOnly(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg backdrop-brightness-50">
            <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-6 relative animate-fadeIn">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Defect Details</h2>

                {/* Image Comparison Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Image */}
                    <div className="bg-gray-100 rounded-lg shadow-sm p-2 text-center">
                        <p className="font-semibold text-sm text-gray-700 mb-2">Original Image</p>
                        <div
                            className="relative h-[300px] flex justify-center items-center cursor-pointer"
                            onClick={() => handleImageClick("original")}
                        >
                            <img
                                src={data.preview}
                                alt="Original Preview"
                                className="max-w-full max-h-full object-contain rounded"
                            />
                        </div>
                    </div>

                    {/* Detected Image */}
                    <div className="bg-gray-100 rounded-lg shadow-sm p-2 text-center">
                        <p className="font-semibold text-sm text-gray-700 mb-2">Analyzed Image</p>
                        <div
                            className="relative h-[300px] flex justify-center items-center cursor-pointer"
                            onClick={() => handleImageClick("detected")}
                        >
                            <img
                                src={data.annotated}
                                alt="Detected Preview"
                                className="max-w-full max-h-full object-contain rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* File Name */}
                <div className="mt-4">
                    <p className="text-gray-600 text-sm">
                        <strong className="font-medium text-gray-700">File Name:</strong> {data.fileName}
                    </p>
                </div>

                {/* Time Stamp */}
                <div className="mt-2">
                    <p className="text-gray-600 text-sm">
                        <strong className="font-medium text-gray-700">Time Stamp:</strong>{" "}
                        {new Date(data.createdTime).toLocaleString()}
                    </p>
                </div>

                {/* Defect Analysis */}
                <div className="mt-4 text-center">
                    <span
                        className={`inline-block px-4 py-2 text-sm font-medium rounded-lg shadow-sm ${
                            data.defects && data.defects.length > 0
                                ? "bg-red-100 text-red-700"
                                : data.defects && data.defects.length === 0
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                        }`}
                    >
                        {data.defects
                            ? data.defects.length > 0
                                ? "Defective"
                                : "Not Defective"
                            : "Classifying..."}
                    </span>
                </div>

                {/* Defects Table */}
                {data.defects && data.defects.length > 0 && (
                    <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full border text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-semibold">
                                <tr>
                                    <th className="border px-4 py-2">#</th>
                                    <th className="border px-4 py-2">Defect Type</th>
                                    <th className="border px-4 py-2">Confidence</th>
                                    <th className="border px-4 py-2">Bounding Box</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.defects.map((defect, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="border px-4 py-2">{index + 1}</td>
                                        <td className="border px-4 py-2 capitalize">{defect.class}</td>
                                        <td className="border px-4 py-2">
                                            {(defect.confidence * 100).toFixed(2)}%
                                        </td>
                                        <td className="border px-4 py-2">
                                            [{defect.bbox.join(", ")}]
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

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
                            src={showImageOnly === "original" ? data.preview : data.annotated}
                            alt="Fullscreen Preview"
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EdgeImageDetailsModal_Custom;
