const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { scanNetwork, savePrinterToDatabase } = require("./snmp.js");



function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, 
            contextIsolation: true, 
            preload: path.join(__dirname, "preload.js") 
        }
    });

    win.loadFile("index.html"); 
}


app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});


app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});


ipcMain.on("start-scan", (event, clientName) => { 
    console.log(`Iniciando scan para o cliente: ${clientName}`);

    if (!clientName) {
        event.reply("scan-error", "Nome do cliente inválido.");
        return;
    }

    const sendProgress = (progress) => event.reply("scan-progress", progress);
    const sendResult = (result) => event.reply("scan-result", result);

    scanNetwork(clientName, sendProgress, sendResult)
        .then(() => event.reply("scan-complete"))
        .catch((error) => event.reply("scan-error", error.message));
});

