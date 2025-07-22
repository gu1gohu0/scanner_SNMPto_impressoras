// database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "snmp_scanner",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Adicione esta função se não existir
async function tableExists(tableName) {
    try {
        const [rows] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
        return rows.length > 0;
    } catch (error) {
        console.error("Erro ao verificar tabela:", error);
        throw error;
    }
}

// Exporte explicitamente
module.exports = {
    pool,
    tableExists // Certifique-se que está exportando
};