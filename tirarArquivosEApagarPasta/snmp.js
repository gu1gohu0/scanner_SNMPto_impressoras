const os = require("os");
const ping = require("ping");
const snmp = require("net-snmp");
const mysql = require("mysql2");

snmp.debug = true;

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "snmp_scanner"
});

connection.connect((err) => {
    if (err) console.error("❌ Erro ao conectar ao MySQL:", err.message);
    else console.log("✅ Conectado ao banco de dados MySQL!");
});

const community = "public";
const printerOids = [
    "1.3.6.1.2.1.43.10.2.1.4.1.1",
    "1.3.6.1.2.1.43.5.1.1.17.1",
    "1.3.6.1.2.1.1.1.0"  
];

function getSubnet() {
    const interfaces = os.networkInterfaces();
    for (let iface in interfaces) {
        for (let alias of interfaces[iface]) {
            if (alias.family === "IPv4" && !alias.internal) {
                const ipParts = alias.address.split(".");
                return `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
            }
        }
    }
    return null;
}

async function checkIp(ip) {
    return new Promise((resolve) => {
        ping.sys.probe(ip, (isAlive) => {
            if (isAlive) resolve(true);
            else resolve(false);
        }, { timeout: 1 });
    });
}

function fetchSNMP(ip) {
    return new Promise((resolve, reject) => {
        console.log(`🔍 Consultando SNMP em ${ip}...`);
        const sessionSnmp = snmp.createSession(ip, community, { version: snmp.Version1, timeout: 1000 });

        sessionSnmp.get(printerOids, (error, varbinds) => {
            if (error) {
                console.error(`❌ Erro SNMP em ${ip}:`, error);
                sessionSnmp.close();
                reject(error);
                return;
            }

            if (!varbinds || varbinds.length === 0) {
                console.error(`❌ Nenhum dado SNMP retornado para ${ip}.`);
                sessionSnmp.close();
                resolve(null);
                return;
            }

            const systemDescr = varbinds[2]?.value?.toString() || "Desconhecido";
            const printerKeywords = ["printer", "canon", "hp", "samsung", "epson", "brother", "xerox", "lexmark", "kyocera", "ricoh", "isd"];
            const isPrinter = printerKeywords.some(keyword => systemDescr.toLowerCase().includes(keyword.toLowerCase()));

            if (isPrinter) {
                const printerInfo = {
                    ip,
                    serial: varbinds[1]?.value?.toString() || "Desconhecido",
                    description: systemDescr,
                    pageCount: varbinds[0]?.value?.toString() || "Desconhecido"
                };
                console.log(`✔️ Impressora encontrada em ${ip}:`, printerInfo);
                resolve(printerInfo);
            } else {
                console.log(`⚠️ Dispositivo ${ip} não parece ser uma impressora.`);
                sessionSnmp.close();
                resolve(null);
            }
        });
    });
}

const { pool } = require('./database');

async function savePrinterToDatabase(tableName, printerInfo) {
    try {
        // Exemplo de INSERT/UPDATE usando o pool
        const [existing] = await pool.query(
            `SELECT * FROM \`${tableName}\` WHERE ip = ? AND serial = ?`,
            [printerInfo.ip, printerInfo.serial]
        );

        if (existing.length > 0) {
            await pool.query(
                `UPDATE \`${tableName}\` SET 
                description = ?, page_count = ?, updated_at = NOW() 
                WHERE ip = ? AND serial = ?`,
                [printerInfo.description, printerInfo.pageCount, printerInfo.ip, printerInfo.serial]
            );
        } else {
            await pool.query(
                `INSERT INTO \`${tableName}\` 
                (ip, serial, description, page_count) 
                VALUES (?, ?, ?, ?)`,
                [printerInfo.ip, printerInfo.serial, printerInfo.description, printerInfo.pageCount]
            );
        }
    } catch (error) {
        throw error;
    }
}




async function scanNetwork(clientName, ipRange, sendProgress, sendResult) {
    const totalIPs = ipRange.length;
    
    for (let i = 0; i < totalIPs; i++) {
        const ip = ipRange[i];
        try {
            // Atualiza progresso
            const progress = Math.floor(((i + 1) / totalIPs) * 100);
            sendProgress(progress);
            
            // Verifica se o IP está ativo
            if (await checkIp(ip)) {
                const printerInfo = await fetchSNMP(ip);
                if (printerInfo) {
                    await savePrinterToDatabase(clientName, printerInfo);
                    sendResult(printerInfo);
                }
            }
        } catch (error) {
            console.error(`Erro no IP ${ip}:`, error);
        }
    }
}

async function checkIp(ip) {
    return new Promise((resolve) => {
        ping.sys.probe(ip, (isAlive) => {
            resolve(isAlive);
        }, { timeout: 1 });
    });
}


module.exports = { scanNetwork, savePrinterToDatabase };