import {
  Menu,
  FileText,
  ChevronDown,
  ChevronRight,
  OctagonAlert
} from "lucide-react"
import { useState, useEffect, useRef } from "react"

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentPage }) => {
  // State to track if edge processing dropdown is open
  const [edgeDropdownOpen, setEdgeDropdownOpen] = useState(false)
  // Add ref for handling outside clicks
  const dropdownRef = useRef(null)
  
  // Main sidebar items
  const sidebarItems = [
    { name: "Health Checker", icon: <OctagonAlert className="h-5 w-5" />, path: "/" },
    { name: "Gemini Upload (V1)", icon: <FileText className="h-5 w-5" />, path: "/gemini" },
    { name: "Ollama Upload (V2)", icon: <FileText className="h-5 w-5" />, path: "/ollama" },
    { name: "Cloud Processing (V3)", icon: <FileText className="h-5 w-5" />, path: "/cloudpipeline" }
  ]

  // Edge processing dropdown items
  const edgeProcessingItems = [
    { name: "With Gemini (V4)", path: "/edgepipeline" },
    { name: "With Gemini (V5)", path: "/edgepipeline1" },
    { name: "With Yolo V8 (V6)", path: "/edgepipeline2" }
  ]

  // To check if the current item is active
  const isActive = (path) => {
    return currentPage === path
  }

  // To check if any edge processing item is active
  const isEdgeActive = () => {
    return edgeProcessingItems.some(item => isActive(item.path))
  }
  
  // Initialize dropdown state - open if any edge item is active
  useEffect(() => {
    if (isEdgeActive()) {
      setEdgeDropdownOpen(true)
    }
  }, [currentPage])

  // Effect to handle outside clicks to close dropdown in collapsed mode
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!sidebarOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setEdgeDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [sidebarOpen])

  // Close dropdown when transitioning from open to closed sidebar
  useEffect(() => {
    if (!sidebarOpen && !isEdgeActive()) {
      setEdgeDropdownOpen(false)
    }
  }, [sidebarOpen, isEdgeActive])

  // To toggle the sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // To toggle the edge processing dropdown
  const toggleEdgeDropdown = () => {
    setEdgeDropdownOpen(!edgeDropdownOpen)
  }

  return (
    <div
      className={`${sidebarOpen ? "w-64" : "w-20"} bg-white shadow-lg transition-all duration-300 ease-in-out flex flex-col h-screen fixed left-0 top-0 z-10`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className={`flex items-center ${!sidebarOpen && "justify-center w-full"}`}>
          <div className="h-8 w-8 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold">QC</span>
          </div>
          {sidebarOpen && <span className="ml-3 font-semibold text-gray-800">Quality Control</span>}
        </div>
        <button onClick={toggleSidebar} className={`text-gray-500 hover:text-gray-700 ${!sidebarOpen && "hidden"}`}>
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-2 px-3">
          {/* Regular menu items */}
          {sidebarItems.map((item, index) => (
            <li key={index}>
              <a
                href={item.path}
                className={`flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                  isActive(item.path) ? "bg-blue-50 text-blue-700" : ""
                } ${!sidebarOpen && "justify-center"}`}
              >
                <span className={`${isActive(item.path) ? "text-blue-600" : "text-gray-500"}`}>{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.name}</span>}
              </a>
            </li>
          ))}

          {/* Edge Processing dropdown */}
          <li ref={dropdownRef} className="relative">
            <button
              onClick={toggleEdgeDropdown}
              className={`w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                isEdgeActive() ? "bg-blue-50 text-blue-700" : ""
              } ${!sidebarOpen && "justify-center"}`}
            >
              <span className={`${isEdgeActive() ? "text-blue-600" : "text-gray-500"}`}>
                <FileText className="h-5 w-5" />
              </span>
              {sidebarOpen && (
                <>
                  <span className="ml-3">Edge Processing</span>
                  <span className="ml-auto">
                    {edgeDropdownOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </>
              )}
            </button>
            
            {/* Dropdown items in expanded mode */}
            {edgeDropdownOpen && sidebarOpen && (
              <ul className="ml-6 mt-2 space-y-2">
                {edgeProcessingItems.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.path}
                      className={`flex items-center p-2 pl-4 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors ${
                        isActive(item.path) ? "bg-blue-50 text-blue-700" : ""
                      }`}
                    >
                      <span className="ml-3 text-sm">{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {/* Compact mode dropdown items */}
            {edgeDropdownOpen && !sidebarOpen && (
              <div className="absolute left-20 mt-0 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                {edgeProcessingItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.path}
                    className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                      isActive(item.path) ? "bg-blue-50 text-blue-700" : ""
                    }`}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            )}
          </li>
        </ul>
      </div>
    </div>
  )
}

export default Sidebar