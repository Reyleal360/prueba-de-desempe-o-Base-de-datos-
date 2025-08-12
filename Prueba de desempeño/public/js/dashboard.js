let currentData = [];
let currentFile = "";

async function loadFileList() {
    const res = await fetch('/files');
    const files = await res.json();

    const select = document.getElementById('csvFile');
    select.innerHTML = '';

    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        select.appendChild(option);
    });
}

document.getElementById('loadBtn').addEventListener('click', async () => {
    currentFile = document.getElementById('csvFile').value;
    const res = await fetch(`/view/${currentFile}`);
    currentData = await res.json();

    displayTable(currentData);
    document.getElementById('saveBtn').style.display = "inline-block";
    document.getElementById('importBtn').style.display = "inline-block";
});

function displayTable(data) {
    if (!data.length) {
        document.getElementById('preview').innerText = 'Archivo vacío';
        return;
    }

    const headers = Object.keys(data[0]);
    let table = "<table><thead><tr>";
    headers.forEach(h => table += `<th>${h}</th>`);
    table += "</tr></thead><tbody>";

    data.forEach((row, rowIndex) => {
        table += "<tr>";
        headers.forEach(h => {
            table += `<td><input value="${row[h]}" data-row="${rowIndex}" data-col="${h}"></td>`;
        });
        table += "</tr>";
    });

    table += "</tbody></table>";
    document.getElementById('preview').innerHTML = table;
}

document.getElementById('saveBtn').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('#preview input');
    inputs.forEach(input => {
        const rowIndex = input.dataset.row;
        const col = input.dataset.col;
        currentData[rowIndex][col] = input.value;
    });

    const res = await fetch(`/update/${currentFile}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentData)
    });

    const result = await res.json();
    if (result.error) {
        alert(result.error);
    } else {
        const s = result.import || {};
        const errs = s.errors && s.errors.length ? `\nErrores:\n- ${s.errors.join('\n- ')}` : '';
        alert(`${result.message || 'Guardado'}\n${s.file ? `Archivo: ${s.file}\n` : ''}Insertados=${s.inserted || 0}, Fallidos=${s.failed || 0}${errs}`);
    }
});

document.getElementById('importBtn').addEventListener('click', async () => {
    const res = await fetch(`/import/${currentFile}`, { method: 'POST' });
    const result = await res.json();
    if (result.error) {
        alert(result.error);
    } else {
        const s = result.import || {};
        const errs = s.errors && s.errors.length ? `\nErrores:\n- ${s.errors.join('\n- ')}` : '';
        alert(`Importado ${s.file}: insertados=${s.inserted || 0}, fallidos=${s.failed || 0}${errs}`);
    }
});

loadFileList();
