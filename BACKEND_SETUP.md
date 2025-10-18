# Backend Setup - OpenPLC Editor & OTA Control

This document explains how to run the backend server for OpenPLC Editor integration and OTA updates.

## 🚀 Quick Start

### Option 1: Run Both Frontend and Backend Together (Recommended)

```bash
npm run dev:all
```

This will start:
- Frontend (Vite) on `http://localhost:5174`
- Backend (Express) on `http://localhost:3001`

### Option 2: Run Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

## 📁 Files Created

1. **`server.js`** - Express backend server
   - Handles OpenPLC Editor launch
   - Handles OTA updates
   - Port: 3001

2. **Updated `package.json`** - Added scripts and dependencies
   - `express` - Web server framework
   - `cors` - CORS middleware
   - `concurrently` - Run multiple commands

## 🔌 API Endpoints

### 1. Open OpenPLC Editor
```
POST http://localhost:3001/api/open-plc-editor
```

**Response:**
```json
{
  "success": true,
  "message": "OpenPLC Editor opened successfully"
}
```

### 2. Send OTA Update
```
POST http://localhost:3001/api/send-ota

Body:
{
  "programFile": "program.st",
  "targetDevice": "ESP32-001"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTA update sent successfully",
  "programFile": "program.st",
  "targetDevice": "ESP32-001"
}
```

### 3. Health Check
```
GET http://localhost:3001/api/health
```

## 🎯 How It Works

### OpenPLC Editor Launch:
1. User clicks "Open PLC Editor" button in Settings page
2. Frontend sends POST request to backend
3. Backend executes shell command:
   ```bash
   cd /home/maulvin/Documents/OpenPLC_Editor && ./openplc_editor.sh
   ```
4. OpenPLC Editor window opens

### OTA Update:
1. User clicks "Send Program via OTA" button
2. Backend sends program via MQTT to device
3. Device receives and updates firmware
4. Status updates shown to user

## 🔧 Troubleshooting

### Backend not starting?
```bash
# Check if port 3001 is already in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>
```

### OpenPLC Editor not opening?
```bash
# Make sure the script is executable
chmod +x /home/maulvin/Documents/OpenPLC_Editor/openplc_editor.sh

# Test manually
cd /home/maulvin/Documents/OpenPLC_Editor
./openplc_editor.sh
```

### CORS errors?
The backend already has CORS enabled. Make sure both servers are running.

## 📝 Development Notes

- Backend runs on port **3001**
- Frontend runs on port **5174** (or 5173)
- CORS is enabled for all origins (change in production!)
- Backend uses `child_process.exec()` to run system commands

## 🔒 Security Notes

**For Production:**
1. Add authentication to API endpoints
2. Restrict CORS to specific origins
3. Validate all inputs
4. Use HTTPS
5. Add rate limiting
6. Sanitize file paths

## 📚 Next Steps

To fully implement OTA:
1. Add file upload functionality
2. Read and parse compiled PLC program
3. Integrate with MQTT service
4. Add progress tracking
5. Handle device responses

---

Made with ❤️ for IIoT Dashboard
