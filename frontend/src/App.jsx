import './App.css'
import { Routes, Route } from "react-router-dom";
import GeminiDefectChecker from './pages/V1_GeminiDefectChecker';
import OllamaDefectChecker from './pages/V2_OllamaDefectChecker';
import CloudDefectCheckerPipeline from './pages/V3_CloudProcessingPipeline';
import EdgeDefectCheckerPipeline from './pages/V4_EdgeProcessingPipeline';
import EdgeDefectCheckerPipeline_Kafka from './pages/V5_EdgeProcessingPipeline';
import EdgeDefectCheckerPipeline_Custom from './pages/V6_EdgeProcessingPipeline';
import Health from './pages/HealthChecker';

function App() {
  
  return (
    <Routes>
            <Route path="/" element={<Health/> } />
            <Route path="/gemini" element={<GeminiDefectChecker />} />
            <Route path="/ollama" element={<OllamaDefectChecker />} />
            <Route path="/cloudpipeline" element={<CloudDefectCheckerPipeline/> } />
            <Route path="/edgepipeline" element={<EdgeDefectCheckerPipeline/> } />
            <Route path="/edgepipeline1" element={<EdgeDefectCheckerPipeline_Kafka/> } />
            <Route path="/edgepipeline2" element={<EdgeDefectCheckerPipeline_Custom/> } />

    </Routes>
  )
}

export default App
