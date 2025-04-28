/**
 * Version 1
 * For the File Upload Functionality
 * Uses Gemini to analyze the image
 */

import React, { useState } from "react";
import { UploadCloud, FileImage, Menu, Info, X, BookOpen } from "lucide-react";
import Sidebar from "../components/Sidebar";

const GeminiDefectChecker = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [noteVisible, setNoteVisible] = useState(true);

  //   To handle the image upload and create object url for it
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };


  //   To make a gemini api call and classify the image
  const classifyImage = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", image);

    try {
      // Backend url, where image processing will occur
      const response = await fetch(`/api/classify-image`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      console.log(data);
      
      setResult(data.classification || "Error");
      console.log(result);
    } catch (error) {
      console.error("Error classifying image:", error);
      setResult("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openDocumentation = () => {
    window.open("https://volcano-lift-3c1.notion.site/V1-Gemini-Upload-1e2ef84556bb80f783b1e000dc9658a9", "_blank");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} currentPage="/gemini" />

      <div className={`flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <div className="flex flex-row">
                {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)} className="mr-4 text-gray-500 hover:text-gray-700">
                    <Menu className="h-6 w-6" />
                  </button>
                )}
                <h1 className="text-2xl font-bold text-gray-800">Defect Analyzer - Gemini</h1>
              </div>
              
              {/* Documentation Button */}
              <button
                onClick={openDocumentation}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">Docs</span>
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
                  <h3 className="font-semibold mb-2 text-blue-800">Automated Defect Detection Process - File Upload Implementation</h3>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>User can simply upload the image.</li>
                    <li>The image is then passed to the processing module, which analyzes the file using <span className="font-bold">Gemini</span>.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}



          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image upload section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Upload Image</h2>

              <label className="cursor-pointer border-dashed border-2 border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors">
                {!preview ? (
                  <>
                    <UploadCloud className="h-12 w-12 text-gray-400 mb-3" />
                    <span className="text-sm font-medium text-gray-700">Click to upload the image</span>
                    <span className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WEBP</span>
                  </>
                ) : (
                  <div className="relative w-full">
                    <img src={preview} alt="Preview" className="rounded-md w-full object-contain max-h-64" />
                    <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 rounded-full p-1">
                      <FileImage className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>

              <button
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center transition-colors"
                onClick={classifyImage}
                disabled={!image || loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Analyzing...
                  </>
                ) : (
                  "Check for Defects"
                )}
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Analysis Results</h2>

              {result ? (
                <div className="mt-2">
                  <div className={`p-4 rounded-md ${result.toLowerCase().includes("defective") && !result.toLowerCase().includes("not defective") ||
                    result.toLowerCase().includes("does not align") ||
                    result.toLowerCase().includes("Error")
                    ? "bg-red-50 border border-red-200"
                    : "bg-green-50 border border-green-200"
                    }`}>
                    <div className="flex items-start">
                      <div>
                        <div className='mt-2 text-sm'>
                          <p>{result}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <FileImage className="h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-center">
                    {loading
                      ? "Analyzing image..."
                      : "Upload an image and click 'Check for Defects' to see results here"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiDefectChecker;