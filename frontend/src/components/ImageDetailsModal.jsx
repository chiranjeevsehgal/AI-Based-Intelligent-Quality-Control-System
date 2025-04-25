/**
 * Modal getting used in V3
 */

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const ImageDetailsModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // To extract Google Drive file ID from the provided URL
    const extractFileId = (url) => {
        const match = url.match(/\/file\/d\/(.*?)\//);
        return match ? match[1] : null;
    };

    // To fetch the image from the backend when the data URL changes
    useEffect(() => {
        const fetchImage = async () => {
            setLoading(true);
            setError(null);
            setImageSrc(null);

            const fileId = extractFileId(data.url);  // Extracts file ID
            if (!fileId) {
                setError("Invalid Google Drive URL");
                setLoading(false);
                return;
            }

            try {
                // Fetch the image from the backend API using the extracted file ID
                const response = await fetch(`https://intelligent-quality-control-system-pilot.onrender.com/api/drive/get-image?fileId=${fileId}`);
                const result = await response.json();

                if (result.data) {
                    setImageSrc(result.data); // Stores Base64 image
                } else {
                    setError("Failed to load image.");
                }
            } catch (error) {
                console.error("Error fetching image:", error);
                setError("Error fetching image.");
            } finally {
                setLoading(false);
            }
        };

        fetchImage();
    }, [data.url]); // Runs whenever the data.url changes


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
                <div className="relative w-full h-[350px] rounded-lg overflow-hidden bg-gray-100 flex justify-center items-center shadow-sm ">
                    {loading ? (
                        // Spinner while loading
                        <div className="flex justify-center items-center">
                            <svg
                                className="w-10 h-10 text-gray-500 animate-spin"
                                viewBox="0 0 50 50"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="5" fill="none" />
                                <path d="M 25 5 A 20 20 0 0 1 45 25" stroke="currentColor" strokeWidth="5" fill="none" />
                            </svg>
                        </div>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : (
                        <a href={data.url} target="_blank" rel="noopener noreferrer">
                            <img
                                src={imageSrc}
                                alt="Preview"
                                className="max-w-full max-h-[300px] object-contain"
                            />
                        </a>
                    )}
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

                {/* Image URL */}
                <div className="mt-2">
                    <p className="text-sm">
                        <strong className="font-medium text-gray-700">URL:</strong>{" "}
                    </p>
                    <div className="max-w-full overflow-x-auto p-1 rounded-md">
                        <a
                            href={data.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline break-all inline-block"
                        >
                            {data.url}
                        </a>
                    </div>
                </div>

                {/* Defect Analysis */}
                <div className="mt-4 text-center">
                    <span className={`inline-block px-4 py-2 text-sm font-medium rounded-lg shadow-sm ${data.result?.toLowerCase().includes("defective") &&
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
            </div>
        </div>
    );
};

export default ImageDetailsModal;
