import { env } from "../../env";

const postmanExampleMarketingEvent = JSON.stringify({
    "eventName": "<string>",
    "eventOrganizer": "<string>",
    "externalAccountId": "<string>",
    "externalEventId": "<string>",
    "startDateTime": "<dateTime>",
    "customProperties": [
      {
        "name": "<string>",
        "requestId": "<string>",
        "selectedByUser": "<boolean>",
        "selectedByUserTimestamp": "<long>",
        "source": "IMPORT",
        "sourceId": "<string>",
        "sourceLabel": "<string>",
        "sourceMetadata": "<string>",
        "sourceVid": [
          "<long>",
          "<long>"
        ],
        "timestamp": "<long>",
        "value": "<string>",
        "updatedByUserId": "<integer>",
        "persistenceTimestamp": "<long>",
        "useTimestampAsPersistenceTimestamp": "<boolean>",
        "isLargeValue": "<boolean>",
        "dataSensitivity": "standard",
        "isEncrypted": "<boolean>",
        "unit": "<string>"
      },
      {
        "name": "<string>",
        "requestId": "<string>",
        "selectedByUser": "<boolean>",
        "selectedByUserTimestamp": "<long>",
        "source": "COMPANY_FAMILIES",
        "sourceId": "<string>",
        "sourceLabel": "<string>",
        "sourceMetadata": "<string>",
        "sourceVid": [
          "<long>",
          "<long>"
        ],
        "timestamp": "<long>",
        "value": "<string>",
        "updatedByUserId": "<integer>",
        "persistenceTimestamp": "<long>",
        "useTimestampAsPersistenceTimestamp": "<boolean>",
        "isLargeValue": "<boolean>",
        "dataSensitivity": "standard",
        "isEncrypted": "<boolean>",
        "unit": "<string>"
      }
    ],
    "eventCancelled": "<boolean>",
    "eventUrl": "<string>",
    "eventDescription": "<string>",
    "eventType": "<string>",
    "endDateTime": "<dateTime>"
  });

const exampleMarketingEvent = {
    "82183880": {
    "item": {
      "id": 82183880,
      "name": "Grundausbildung 2 Frankfurt 11/2008",
      "typeid": 2,
      "created": "2013-06-04T15:49:10+00:00",
      "viewed": "2020-06-25T07:56:40+00:00",
      "updated": "2019-12-11T10:57:56+00:00",
      "ownership": 78988907,
      "flagged": false,
      "identicon": {
        "color": "#FFFFFF",
        "bgcolor": "#F18864",
        "text": "G2"
      },
      "fields": {
        "title": "Grundausbildung 2 Frankfurt 11/2008",
        "custom11536909": "Séminaire de base",
        "custom11536902": "2007-12-11",
        "description": "Séminaire de base",
        "custom11536896": "701200000005WtJ",
        "background": "<div>Referent: Dr. Glady, Orga ISS</div><div>Seminarort: Mercure Hotel &amp; Residenz Frankfurt Messe, Voltastr. 29, 60486 Frankfurt, Tel. 069-7926-0, Fax 7926-1707, E-mail: H1204-FB@accor.com</div><div>Zeiten: Sa. 13.30 bis 19.00 Uhr, So. 09.30 - 16.00 Uhr</div><div>Gebühr: 260,-(234,-) ?</div><div>____________________</div><div>15 Teilnehmer, davon 8 Mediziner und 7 HP</div><div>15 abgegebene Beurteilungsbögen:</div><div>10 x 1</div><div>3 x 1 - 2</div><div>2 x 2</div><div>Positiv hervorgehoben wurde die Fachkompetenz, das umfassende Wissen und die lockere Art des Referenten, die Darbietung und Organisation, die gute Grundlagenvermittlung mit Praxisbezug.</div><div>Wünsche/Verbesserungsvorschläge:</div><div>Mehr Beispiele aus der Praxis, Kasuistiken, mehr Zeit für Fragen, Wiederholungsseminar nach Grundausbildung 1 + 2, Literatur Immunologie, Molekularbiologie, Interleukinen. Bzgl. Interleutkine nochmals den Hinweis auf \"cope\"gegeben.</div><div>Der Komplex HLA-System wurde ausführlich besprochen, da hierzu viele Fragen bestanden. HLA-Liste aus Internet verteilt.</div>",
        "archived": 0,
        "creatorid": 82166362,
        "creatorname": "Admin",
        "creatordate": "2013-06-04T15:49:10+00:00",
        "modificatorid": 220575653,
        "modificatorname": "Elena Núñez",
        "modificatordate": "2019-12-11T10:57:56+00:00"
      }
    },
    "activities": [],
    "categories": [],
    "relateditems": [],
    "status": "success"
  }
}

// Función para importar un solo evento de marketing a HubSpot
export const importSingleMarketingEventToHubspot = async () => {
  const item = exampleMarketingEvent["82183880"].item;
  const fields = item.fields;

  // Datos del evento que deseas importar
  const eventData = {
    properties: {
      description: fields.description,
      eventName: item.name || "Default Event Name",
      eventOrganizer: fields.creatorname || "Default Organizer",
      externalAccountId: fields.custom11536896 || "Default Account ID",
      externalEventId: item.id.toString() || "Default Event ID",
      customProperties: [
        {
          solve_id: item.id,
          hs_event_name: item.name,
          created_date__in_sove_: item.created,
          hs_lastmodifieddate: item.updated,
          hs_event_type: fields.custom11536909,
        }
      ]
      // Agrega más mapeos según sea necesario
    }
  };

  // Configurar las opciones de la solicitud
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.HS_PRIVATE_APP_KEY}`,
    },
    body: JSON.stringify({ inputs: [eventData] }),
  };

  try {
    const response = await fetch("https://api.hubapi.com/crm/v3/marketing-events", requestOptions);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error al importar el evento:`, errorText);
      return;
    }
    const result = await response.json();
    console.log(`Importación del evento completada:`, result);
  } catch (error) {
    console.error(`Error al importar el evento:`, error);
  }
};

// Llamar a la función para probar la importación
importSingleMarketingEventToHubspot();
