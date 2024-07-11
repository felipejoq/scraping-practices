import puppeteer from "puppeteer";

const URL_BASE = "https://www.sii.cl/valores_y_fechas/uf/uf2024.htm";

const getUFValues = async () => {
  // Inicia el navegador
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navega a la página deseada
  await page.goto(URL_BASE);

  // Espera a que cualquier tabla dentro de un div visible esté disponible
  await page.waitForSelector('div[style*="display: block;"] table', { visible: true });

  // Extrae los datos de la tabla visible
  const data = await page.evaluate(() => {
    // Selecciona la tabla dentro del div visible
    const table = document.querySelector('div[style*="display: block;"] table');
    if (!table) return [];

    const rows = table.querySelectorAll('tbody tr');
    let month;
    const tableData = [];

    rows.forEach((row, rowIndex) => {
      if (rowIndex === 0) {
        // Obtiene el mes desde la primera fila
        const monthHeader = row.querySelector('th h2');
        if (monthHeader) {
          month = monthHeader.innerText.trim();
        }
        return;
      }

      const cells = row.querySelectorAll('th, td');
      for (let i = 0; i < cells.length; i += 2) {
        const dayCell = cells[i];
        const valueCell = cells[i + 1];
        if (valueCell && valueCell.innerText.trim() !== '') {
          const day = parseInt(dayCell.innerText.trim());
          const value = parseFloat(valueCell.innerText.trim().replace(/\./g, '')
            .replace(',', '.'));
          tableData.push({ day, value });
        }
      }
    });

    // Ordenar los datos por día
    tableData.sort((a, b) => a.day - b.day);

    // Obtener el año actual
    const year = new Date().getFullYear();

    // Convertir los datos a un formato con fecha completa
    return tableData.map(item => {
      const date = new Date(year, new Date(`${month} 1, ${year}`).getMonth(), item.day);
      return {date: date.toISOString().split('T')[0], value: item.value};
    });
  });

  // Cerrar el navegador
  await browser.close();

  // Retornamos los datos extraídos
  return data;
}

// Ejecutar la función y mostrar los datos
getUFValues()
.then((data) => console.log(data))
.catch((error) => console.error(error));
