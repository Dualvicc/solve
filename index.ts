import * as fs from 'fs';
import * as path from 'path';
import { env } from './env';
import { parseStringPromise } from 'xml2js';

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

// Función para leer el archivo data.json, extraer los IDs y guardarlos en un archivo
function getIdsFromDataFile(filePath: string): number[] {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);
    const ids = Object.keys(data)
        .filter(key => !isNaN(Number(key))) // Filtra solo las claves que son números (IDs)
        .map(Number);

    // Guardar los IDs en un archivo JSON
    const idsFilePath = path.join(path.dirname(filePath), 'ids.json');
    fs.writeFileSync(idsFilePath, JSON.stringify(ids, null, 2));
    console.log(`IDs guardados exitosamente en ${idsFilePath}`);

    return ids;
}

// Función para hacer fetch de datos detallados por ID
async function fetchDetailedDataById(id: number): Promise<any> {
    const response = await fetch(`${env.BASE_URL}/projectblogs/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + btoa(`${env.USER_EMAIL}:${env.API_KEY}`),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Error fetching data for ID ${id}: ${response.statusText}`);
    }

    return response.json();
}

// Función principal para procesar los IDs y guardar los datos detallados
async function processAndSaveDetailedData() {
    const dataFilePath = path.join(__dirname, 'projectblogs', 'detailedData.json');
    const stateFilePath = path.join(__dirname, 'projectblogs', 'state.json');
    const ids = [
        220133598, 223079677, 224091288, 224119556, 225621775, 227028298, 227028303, 227028308,
        228522687, 228663207, 228878681, 228878708, 229927653, 230641703, 231388386, 231388393,
        231388401, 233449443, 234742015, 234742105, 236295121, 236299952, 236471383, 237479048,
        237479076, 237479098, 237479156, 237479159, 238175526, 239014910, 245253864, 247123282,
        248198328, 249006697, 249261791, 253186930, 254686977, 255710304, 256400305, 258888591,
        259448166, 264787710, 272619519, 280074612, 282014743, 283361664, 286968034, 292057791,
        292381873, 293730131
    ];

    // Cargar el estado anterior si existe
    let startIndex = 0;
    if (fs.existsSync(stateFilePath)) {
        const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
        startIndex = state.lastProcessedIndex || 0;
    }

    // Cargar datos existentes si el archivo ya existe
    let detailedData: Record<number, any> = {};
    if (fs.existsSync(dataFilePath)) {
        detailedData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    }

    for (let i = startIndex; i < ids.length; i++) {
        const id = ids[i];
        try {
            const data = await fetchDetailedDataById(id);
            detailedData[id] = data;

            // Guardar el progreso
            fs.writeFileSync(dataFilePath, JSON.stringify(detailedData, null, 2));
            fs.writeFileSync(stateFilePath, JSON.stringify({ lastProcessedIndex: i + 1 }, null, 2));

            console.log(`Datos detallados guardados para ID ${id}`);
        } catch (error) {
            console.error(`Error al obtener datos detallados para ID ${id}:`, error);
            break; // Detener el proceso si hay un error
        }
    }

    // Eliminar el archivo de estado si se completó todo
    if (fs.existsSync(stateFilePath)) {
        fs.unlinkSync(stateFilePath);
    }
}

// Función para leer y convertir XML a JSON
async function convertXmlToJsonAndSave(filePath: string, outputFilePath: string): Promise<any> {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const jsonData = await parseStringPromise(xmlData);
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
    return jsonData;
}

// Función para comparar dos objetos JSON
function compareJsonObjects(json1: any, json2: any): void {
    const keys1 = Object.keys(json1);
    const keys2 = Object.keys(json2);

    const missingInJson1 = keys2.filter(key => !keys1.includes(key));
    const missingInJson2 = keys1.filter(key => !keys2.includes(key));

    if (missingInJson1.length > 0) {
        console.log('Keys missing in JSON 1:', missingInJson1);
    }

    if (missingInJson2.length > 0) {
        console.log('Keys missing in JSON 2:', missingInJson2);
    }

    // Compare values for common keys
    keys1.forEach(key => {
        if (keys2.includes(key) && JSON.stringify(json1[key]) !== JSON.stringify(json2[key])) {
            console.log(`Difference found in key ${key}:`);
            console.log('JSON 1:', json1[key]);
            console.log('JSON 2:', json2[key]);
        }
    });
}

// Función principal para comparar detailedData.json con content.xml
async function compareDetailedDataWithXml() {
    const jsonFilePath = path.join(__dirname, 'projectblogs', 'detailedData.json');
    const xmlFilePath = path.join(__dirname, 'projectblogs', 'content.xml');
    const xmlJsonFilePath = path.join(__dirname, 'projectblogs', 'content.json');

    // Leer y parsear detailedData.json
    const detailedData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Convertir content.xml a JSON y guardarlo
    const xmlData = await convertXmlToJsonAndSave(xmlFilePath, xmlJsonFilePath);

    // Comparar los dos JSON
    compareJsonObjects(detailedData, xmlData);
}

// fetchAndSaveData();

// processAndSaveDetailedData();

compareDetailedDataWithXml().catch(error => console.error('Error:', error));