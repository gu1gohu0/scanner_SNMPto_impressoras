const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { scanNetwork } = require("./snmp.js");
const net = require("net");
const os = require('os'); // Adicionado para detectar a sub-rede
const { pool, tableExists } = require("./database");

// Função para detectar a sub-rede local (ex: '192.168.1')
function getLocalSubnet() {
    const interfaces = os.networkInterfaces();
    for (const iface in interfaces) {
        for (const alias of interfaces[iface]) {
            if (alias.family === 'IPv4' && !alias.internal) {
                const ipParts = alias.address.split('.');
                return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
            }
        }
    }
    throw new Error("Não foi detectar a sub-rede local");
}

// Função principal atualizada
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

// IPC Handler atualizado
ipcMain.on("start-scan", async (event, { clientName, startOctet, endOctet }) => {
    console.log(`Iniciando scan para ${clientName} (${startOctet}-${endOctet})`);
    
    try {
        // Validações básicas
        if (!clientName?.trim()) throw new Error("Nome do cliente inválido");
        if (isNaN(startOctet) || startOctet < 1 || startOctet > 254) throw new Error("Octeto inicial inválido (1-254)");
        if (isNaN(endOctet) || endOctet < 1 || endOctet > 254) throw new Error("Octeto final inválido (1-254)");
        if (startOctet > endOctet) throw new Error("O octeto inicial deve ser menor ou igual ao final");

        // Obtém a sub-rede automaticamente
        const subnet = getLocalSubnet();
        const tableName = clientName.replace(/\W+/g, "_").toLowerCase();

        // Verifica a tabela
        if (!await tableExists(tableName)) {
            throw new Error(`Tabela '${tableName}' não encontrada no banco`);
        }

        // Gera os IPs completos
        const ipRange = Array.from(
            { length: endOctet - startOctet + 1 },
            (_, i) => `${subnet}.${startOctet + i}`
        );

        // Configura callbacks
        const sendProgress = (p) => event.reply("scan-progress", p);
        const sendResult = (r) => event.reply("scan-result", r);

        // Executa o scan
        await scanNetwork(tableName, ipRange, sendProgress, sendResult);
        
        event.reply("scan-complete", `✅ Scan finalizado! ${ipRange.length} IPs verificados`);

    } catch (error) {
        console.error("Erro no scan:", error);
        event.reply("scan-error", error.message);
    }
});