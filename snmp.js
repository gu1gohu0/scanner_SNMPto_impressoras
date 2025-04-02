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
            const printerKeywords = ["printer", "canon", "hp", "samsung"];
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


function ensureClientTable(clientName) {
    if (typeof clientName !== "string") {
        console.error("❌ Erro: clientName não é uma string válida!", clientName);
        return Promise.reject(new Error("clientName deve ser uma string!"));
    }

    const tableName = clientName.replace(/\s+/g, "_").toLowerCase(); 
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS \`${tableName}\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cliente_id INT DEFAULT 1,
            ip VARCHAR(15) NOT NULL,
            serial VARCHAR(255),
            description TEXT,
            page_count INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    return new Promise((resolve, reject) => {
        connection.query(createTableQuery, (error) => {
            if (error) {
                console.error(`❌ Erro ao criar/verificar tabela do cliente ${clientName}:`, error.message);
                reject(error);
            } else {
                console.log(`✅ Tabela '${tableName}' pronta para uso.`);
                resolve(tableName);
            }
        });
    });
}


async function savePrinterToDatabase(clientName, printerInfo) {
    const tableName = await ensureClientTable(clientName);

    return new Promise((resolve, reject) => {
        // Primeiro, busca o valor do campo cliente do ID 1
        const getClientQuery = `SELECT cliente FROM \`${tableName}\` WHERE id = 1 LIMIT 1`;

        connection.query(getClientQuery, (error, results) => {
            if (error) {
                console.error(`❌ Erro ao buscar cliente do ID 1:`, error.message);
                return reject(error);
            }

            const clienteValue = results.length > 0 ? results[0].cliente : "Desconhecido";

            // Verifica se a impressora já está cadastrada
            const checkQuery = `SELECT * FROM \`${tableName}\` WHERE ip = ? AND serial = ?`;
            connection.query(checkQuery, [printerInfo.ip, printerInfo.serial], (error, results) => {
                if (error) {
                    console.error(`❌ Erro ao verificar impressora no banco:`, error.message);
                    return reject(error);
                }

                if (results.length > 0) {
                    // Impressora já existe, então faz UPDATE
                    const updateQuery = `
                        UPDATE \`${tableName}\`
                        SET description = ?, page_count = ?, created_at = CURRENT_TIMESTAMP, cliente = ?
                        WHERE ip = ? AND serial = ?
                    `;
                    const values = [printerInfo.description, printerInfo.pageCount, clienteValue, printerInfo.ip, printerInfo.serial];

                    connection.query(updateQuery, values, (updateError, updateResults) => {
                        if (updateError) {
                            console.error(`❌ Erro ao atualizar impressora:`, updateError.message);
                            return reject(updateError);
                        }
                        console.log(`🔄 Impressora atualizada no banco: ${printerInfo.ip}`);
                        resolve(updateResults);
                    });

                } else {
                    // Impressora não existe, então faz INSERT
                    const insertQuery = `
                        INSERT INTO \`${tableName}\` (cliente, ip, serial, description, page_count)
                        VALUES (?, ?, ?, ?, ?)
                    `;
                    const values = [clienteValue, printerInfo.ip, printerInfo.serial, printerInfo.description, printerInfo.pageCount];

                    connection.query(insertQuery, values, (insertError, insertResults) => {
                        if (insertError) {
                            console.error(`❌ Erro ao inserir impressora:`, insertError.message);
                            return reject(insertError);
                        }
                        console.log(`✅ Impressora salva no banco: ${printerInfo.ip}`);
                        resolve(insertResults);
                    });
                }
            });
        });
    });
}



async function scanNetwork(clientName, sendProgress, sendResult) {
    if (!clientName || typeof clientName !== "string") return;

    const subnet = getSubnet();
    if (!subnet) return;

    console.log(`🔍 Escaneando: ${subnet}.X`);
    for (let i = 155; i <= 160; i++) {
        const ip = `${subnet}.${i}`;
        try {
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
        sendProgress(Math.floor(((i - 1 + 1) / 254) * 100));
    }
}

module.exports = { scanNetwork, savePrinterToDatabase };