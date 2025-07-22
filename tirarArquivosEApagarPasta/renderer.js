window.electronAPI.onScanProgress((event, progress) => {
    const progressBar = document.getElementById("scanProgress");
    const progressText = document.getElementById("progressText");
    progressBar.value = progress;
    progressText.textContent = `${progress}%`;
});

window.electronAPI.onScanResult((event, result) => {
    const resultsList = document.getElementById("resultsList");
    const listItem = document.createElement("li");
    listItem.textContent = `IP: ${result.ip}, Serial: ${result.serial}, Descrição: ${result.description}, Páginas: ${result.pageCount}`;
    resultsList.appendChild(listItem);
});

window.electronAPI.onScanComplete(() => {
    alert("Scan concluído!");
});

window.electronAPI.onScanError((event, error) => {
    alert(`Erro durante o scan: ${error}`);
});

document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startScan');
    
    startButton.addEventListener('click', async () => {
        try {
            // Obtenha os elementos corretamente
            const clientNameEl = document.getElementById('clientName');
            const ipStartEl = document.getElementById('ipStart');
            const ipEndEl = document.getElementById('ipEnd');
            
            // Verifique se os elementos existem
            if (!clientNameEl || !ipStartEl || !ipEndEl) {
                throw new Error('Elementos do formulário não encontrados!');
            }
            
            // Obtenha os valores
            const clientName = clientNameEl.value.trim();
            const startOctet = parseInt(ipStartEl.value);
            const endOctet = parseInt(ipEndEl.value);
            
            // Validações básicas
            if (!clientName) throw new Error('Nome do cliente é obrigatório');
            if (isNaN(startOctet)) throw new Error('Octeto inicial inválido');
            if (isNaN(endOctet)) throw new Error('Octeto final inválido');
            
            // Chame o Electron
            window.electronAPI.startScan(clientName, startOctet, endOctet);
            
        } catch (error) {
            console.error('Erro ao iniciar scan:', error);
            alert(error.message);
        }
    });
});

