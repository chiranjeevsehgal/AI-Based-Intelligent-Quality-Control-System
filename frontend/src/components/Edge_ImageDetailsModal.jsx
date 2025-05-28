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

    const formatStructuredResult = (text) => {
        if (!text) return null;

        const formattedText = text.replace(/\\n/g, '\n');
        
        // Check if it's an invalid/out-of-scope message
        const isInvalidScope = formattedText.toLowerCase().includes('does not align') || 
                              formattedText.toLowerCase().includes('not align') ||
                              formattedText.toLowerCase().includes('please provide');
        
        if (isInvalidScope) {
            return (
                <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {/* Classification for Invalid */}
                    <div className="pb-2 mb-2 font-semibold text-base bg-gray-50 text-gray-800 border-b border-gray-300">
                        Classification: Invalid/Out of Scope
                    </div>
                    
                    {/* Analysis */}
                    <div>
                        <h4 className="font-semibold text-gray-700 text-sm">
                            Analysis:
                        </h4>
                        <div className="p-1 rounded-lg text-justify bg-gray-50 border-gray-300">
                            <p className="text-sm leading-relaxed text-gray-700">
                                {formattedText.trim()}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        const sections = {};
        let currentSection = 'general';
        let currentContent = [];

        const lines = formattedText.split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
            const trimmedLine = line.trim();

            if (trimmedLine.toLowerCase().startsWith('classification:')) {
                sections.classification = trimmedLine;
            } else if (trimmedLine.toLowerCase().startsWith('analysis:')) {
                currentSection = 'analysis';
                currentContent = [trimmedLine.substring(9).trim()];
            } else if (trimmedLine.toLowerCase().startsWith('detected issues:')) {
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent;
                }
                currentSection = 'detectedIssues';
                currentContent = [];
            } else {
                currentContent.push(trimmedLine);
            }
        });

        if (currentContent.length > 0) {
            sections[currentSection] = currentContent;
        }

        const isDefective = sections.classification?.toLowerCase().includes('defective') &&
                           !sections.classification?.toLowerCase().includes('not defective');
        const isNotDefective = sections.classification?.toLowerCase().includes('not defective');

        if (isDefective) {
            // DEFECTIVE
            return (
                <div className="space-y-3 bg-red-50 p-3 rounded-lg border border-red-200">
                    {/* Classification */}
                    {sections.classification && (
                        <div className="pb-2 mb-2 font-semibold text-base bg-red-50 text-red-800 border-b border-red-300">
                            {sections.classification}
                        </div>
                    )}

                    {/* Analysis */}
                    {sections.analysis && (
                        <div>
                            <h4 className="font-semibold text-red-700 text-sm">
                                Analysis:
                            </h4>
                            <div className="p-1 text-justify bg-red-50 border-b border-red-300">
                                {sections.analysis.map((line, index) => (
                                    <p key={index} className="text-xs leading-relaxed mb-1 last:mb-0 text-red-700">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Detected Issues */}
                    {sections.detectedIssues && sections.detectedIssues.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-red-700 text-sm">Detected Issues:</h4>
                            <div className="bg-red-50 p-1 rounded-lg text-justify">
                                {sections.detectedIssues.map((issue, index) => (
                                    <div key={index} className="flex items-center flex-row last:mb-0">
                                        <span className="text-red-700 text-xs">
                                        <span className="mr-2 text-red-500 font-bold">•</span>
                                            {issue.startsWith('-') ? issue.substring(1).trim() : issue}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        } else if (isNotDefective) {
            // NOT DEFECTIVE
            return (
                <div className="space-y-3 bg-green-50 p-3 rounded-lg border border-green-200">
                    {/* Classification */}
                    {sections.classification && (
                        <div className="pb-2 mb-2 font-semibold text-base bg-green-50 text-green-800 border-b border-green-400">
                            {sections.classification}
                        </div>
                    )}

                    {/* Analysis */}
                    {sections.analysis && (
                        <div>
                            <h4 className="font-semibold text-green-700 text-sm">
                                Analysis:
                            </h4>
                            <div className="p-1 rounded-lg text-justify bg-green-50 border-green-300">
                                {sections.analysis.map((line, index) => (
                                    <p key={index} className="text-xs leading-relaxed mb-1 last:mb-0 text-green-700">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            );
        } 
    };

    return (
        <div className="fixed inset-0 backdrop-blur-lg backdrop-brightness-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Defect Analysis Details</h2>

                {/* Image Preview */}
                <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-gray-100 flex justify-center items-center shadow-sm mb-4">
                    <div 
                        className="cursor-pointer"
                        onClick={handleImageClick}
                    >
                        <img
                            src={data.preview}
                            alt="Preview"
                            className="max-w-full max-h-[280px] object-contain"
                        />
                    </div>
                </div>

                {/* File Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-gray-600 text-sm">
                            <strong className="font-medium text-gray-700">File Name:</strong> {data.fileName}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600 text-sm">
                            <strong className="font-medium text-gray-700">Time Stamp:</strong> {new Date(data.createdTime).toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Structured Analysis Results */}
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Analysis Results</h3>
                    {data.result ? (
                        formatStructuredResult(data.result)
                    ) : (
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                            <p className="text-gray-500">Analyzing...</p>
                        </div>
                    )}
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