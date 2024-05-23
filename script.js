document.getElementById('fileUpload').addEventListener('change', handleFile, false);

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
        
        // Process the sheetData
        const arrivals = sheetData[2].filter(x => x !== undefined).map(Number);
        const services = sheetData[6].filter(x => x !== undefined).map(Number);
        const servers = 3;  // Assuming the number of servers is 3, you can also add input field to get this from user.

        calculate(arrivals, services, servers);
    };
    reader.readAsArrayBuffer(file);
}

function calculate(arrivals, services, servers) {
    if (arrivals.length === 0 || services.length === 0 || servers <= 1) {
        alert('Por favor, ingrese valores válidos y asegúrese de que el número de servidores sea mayor que 1.');
        return;
    }

    const totalArrivalTime = arrivals.reduce((a, b) => a + b, 0);
    const totalServiceTime = services.reduce((a, b) => a + b, 0);

    const lambda = arrivals.length / totalArrivalTime; // Número total de llegadas dividido por tiempo total
    const mu = services.length / totalServiceTime; // Número total de servicios dividido por tiempo total
    const c = servers;
    const rho = lambda / (c * mu);

    if (lambda >= mu * c) {
        alert('El factor de utilización debe ser menor que 1 para que el sistema sea estable.');
        return;
    }

    // Calcular P0
    let sum = 0;
    for (let n = 0; n < c; n++) {
        sum += Math.pow(lambda / mu, n) / factorial(n);
    }
    const P0 = 1 / (sum + (Math.pow(lambda / mu, c) / (factorial(c) * (1 - rho))));

    // Calcular Lq
    const Lq = (Math.pow(lambda / mu, c) * rho * P0) / (factorial(c) * Math.pow(1 - rho, 2));

    // Calcular L
    const L = Lq + lambda / mu;

    // Calcular Wq
    const Wq = Lq / lambda;

    // Calcular W
    const W = Wq + 1 / mu;

    // Calcular Pw
    const Pw = 1 - P0;

    // Mostrar resultados
    document.getElementById('results').innerHTML = `
        <p>λ (Tasa de llegada): ${lambda.toFixed(4)}</p>
        <p>μ (Tasa de servicio): ${mu.toFixed(4)}</p>
        <p>P0 (Probabilidad de 0 clientes): ${P0.toFixed(4)}</p>
        <p>Lq (Clientes promedio en cola): ${Lq.toFixed(4)}</p>
        <p>L (Clientes promedio en el sistema): ${L.toFixed(4)}</p>
        <p>Pw (Probabilidad de espera): ${Pw.toFixed(4)}</p>
        <p>Wq (Tiempo promedio en cola en minutos): ${Wq.toFixed(4)}</p>
        <p>W (Tiempo promedio en el sistema en minutos): ${W.toFixed(4)}</p>
    `;
}

function factorial(n) {
    return n ? n * factorial(n - 1) : 1;
}

function downloadTemplate() {
    const ws_data = [
        ["Tiempos de Llegada (en minutos)"],
        ["Tiempo entre llegadas (en minutos)"],
        ["3", "4", "2", "5", "1", "2", "4", "3", "2", "4"],
        [],
        ["Tiempos de Servicio (en minutos)"],
        ["Tiempo de servicio (en minutos)"],
        ["6", "7", "4", "5", "6", "8", "7", "6", "7", "8"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

    XLSX.writeFile(wb, "plantilla_tiempos.xlsx");
}
