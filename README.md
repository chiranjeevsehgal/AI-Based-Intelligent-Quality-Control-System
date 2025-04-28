# Intelligent Quality Control System

## Overview
This project is a **POC** for an **Intelligent Quality Control System** that leverages AI to detect defects in real-time. It processes vision data and uses LLM, YOLOv8 models to identify defects quickly and efficiently, aiming at reliable quality control.

## Tech Stack
- **Frontend**: React.js, Tailwind CSS, Web Socket
- **Backend**: Node.js, Express.js
- **AI Services**: Gemini, Ollama Gemma3, YOLOv8 
- **Automation**: Google AppScript
- **Orchestration**: Apache Airflow
- **Communication**: WebSocket, Kafka
- **Containerization**: Docker

## Project Structure
```
├── airflow/
├── ├── Dockerfile
├── ├── requirements.txt
├── dags/
├── ├── folder_monitor_dag.py
├── frontend/
├── ├── src/
├── ├── ├── components/
├── ├── ├── pages/
├── ├── ├── app.jsx
├── ├── ├── ...
├── ├── .env
├── ├── package.json
├── backend/
├── ├── controllers/
├── ├── ├── analysis.controller.js
├── ├── ├── drive.controller.js
├── ├── ├── websocket.controller.js
├── ├── routes/
├── ├── ├── analysis.routes.js
├── ├── ├── drive.routes.js
├── ├── ├── websocket.routes.js
├── ├── services/
├── ├── ├── airflow.service
├── ├── ├── drive.service.js
├── ├── ├── file-watcher.service.js
├── ├── ├── analysis.service.js
├── ├── .env
├── ├── app.js
├── ├── server.js
├── ├── .....
├── monitor
├── docker-compose.yaml
├── README.md
```

## Cloning the repository
    
```bash
git clone https://github.com/chiranjeevsehgal/Intelligent-Quality-Control-System.git
cd Intelligent-Quality-Control-System
```

## Configuration
**Environment Files**
    
    #Backend: Create a .env file inside backend/ and configure necessary environment variables
    GEMINI_API_KEY = <YOUR_GEMINI_API_KEY>
    GEMINI_MODEL = gemini-1.5-pro-002
    OLLAMA_BASE_URL = http://127.0.0.1:11434 or http://ollama:11434 (Depending upon local or docker implementation of ollama)
    CUSTOM_MODEL_URL = https://suryanshbachchan.us-east-1.modelbit.com/v1/defect_detection_base64_to_base64/latest
    PORT = 5001 (If changing, change in docker-compose file as well)
    KAFKA_BROKER=kafka:9092
    
    #Frontend: Create another .env file inside frontend/ and configure necessary environment variables
    VITE_API_URL = http://localhost:5001  (Assuming, you are using the same port)
    VITE_WEB_SOCKET_URL=ws://localhost:5001/api/ws
    

## Build & Start the Services
    docker-compose build
    docker-compose up

## Monitor the logs
- The frontend takes ~5-10 seconds to initialize.
- Assuming you have not modified the port, dashboard would be accessible at: http://localhost:5173/
- You can monitor rest of the system's health, through the health checker on the dashboard.
