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

document.getElementById("startScan").addEventListener("click", () => {
    const clientName = document.getElementById("clientName").value.trim(); // Obtém o valor corretamente

    if (!clientName) {
        alert("Por favor, insira um nome de cliente antes de iniciar o scan.");
        return;
    }

    document.getElementById("resultsList").innerHTML = "";
    window.electronAPI.startScan(clientName); // Envia o nome do cliente corretamente
});


