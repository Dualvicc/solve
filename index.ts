import * as fs from 'fs';
import * as path from 'path';
import { env } from './env';

const endpoints = {
    projectblogs: '/projectblogs', // Añade más endpoints según sea necesario
};

async function fetchAndSaveData() {
    try {
        for (const [folderName, endpoint] of Object.entries(endpoints)) {
            const response = await fetch(env.BASE_URL + endpoint, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${env.USER_EMAIL}:${env.API_KEY}`),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error en la solicitud a ${endpoint}: ${response.statusText}`);
            }

            const data = await response.json();

            // Crea la carpeta si no existe
            const dir = path.join(__dirname, folderName);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }

            // Guarda los datos en un archivo dentro de la carpeta
            const filePath = path.join(dir, 'data.json');
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            console.log(`Datos guardados exitosamente en ${folderName}/data.json`);
        }
    } catch (error) {
        console.error('Error al obtener o guardar los datos:', error);
    }
}

fetchAndSaveData();
