const { contextBridge, ipcRenderer } = require("electron");


contextBridge.exposeInMainWorld("electronAPI", {
    startScan: (clientName) => ipcRenderer.send("start-scan", clientName),
    onScanProgress: (callback) => ipcRenderer.on("scan-progress", callback),
    onScanResult: (callback) => ipcRenderer.on("scan-result", callback),
    onScanComplete: (callback) => ipcRenderer.on("scan-complete", callback),
    onScanError: (callback) => ipcRenderer.on("scan-error", callback)
});
