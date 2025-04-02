const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',  
    password: '',  
    database: 'snmp_scanner'
});

connection.connect(err => {
    if (err) {
        console.error('❌ Erro ao conectar ao MySQL:', err.message);
        return;
    }
    console.log('✅ Conectado ao banco de dados MySQL!');
});

module.exports = connection;
