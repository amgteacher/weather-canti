// Función para mostrar mensajes o resultados en el div "result"
function displayResult(message) {
  document.getElementById('result').innerHTML = message;
}

// Función para obtener el valor introducido en el campo de texto
function getCity() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) {
    displayResult("Por favor, introduce una localidad válida.");
    throw new Error("Localidad no proporcionada");
  }
  return city;
}

// Función de geocodificación utilizando Nominatim (OpenStreetMap)
// Convierte el nombre de la ciudad en coordenadas (latitud y longitud)
function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`;
  
  return fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.length === 0) throw new Error("No se encontró la localidad.");
      // Devolvemos la primera opción (la más probable)
      return data[0];
    });
}

/* ------------------------- Funciones para consultar APIs de clima ------------------------- */

// 1. Obtener el tiempo actual usando Open‑Meteo (no requiere autenticación)
function getCurrentWeather() {
  const city = getCity();
  displayResult(`Buscando la localidad "${city}"...`);
  
  geocodeCity(city)
    .then(location => {
      const lat = location.lat;
      const lon = location.lon;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

      return fetch(url)
        .then(response => response.json())
        .then(data => {
          const weather = data.current_weather;
          // Creamos un HTML con los datos del tiempo actual
          const resultHTML = `
            <h3>Tiempo Actual en ${location.display_name}</h3>
            <p><strong>Temperatura:</strong> ${weather.temperature}°C</p>
            <p><strong>Viento:</strong> ${weather.windspeed} km/h</p>
            <p><strong>Hora:</strong> ${weather.time}</p>
          `;
          displayResult(resultHTML);
          // Guardamos la búsqueda en la base de datos
          saveSearch("Tiempo Actual", city, resultHTML);
        });
    })
    .catch(error => {
      displayResult("Error: " + error.message);
    });
}

// 2. Obtener el pronóstico a 15 días usando Open‑Meteo
function get15DaysForecast() {
  const city = getCity();
  displayResult(`Buscando la localidad "${city}"...`);
  
  geocodeCity(city)
    .then(location => {
      const lat = location.lat;
      const lon = location.lon;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=15`;

      return fetch(url)
        .then(response => response.json())
        .then(data => {
          let forecastHTML = `<h3>Pronóstico a 15 días para ${location.display_name}</h3>`;
          const times = data.daily.time;
          const tempMax = data.daily.temperature_2m_max;
          const tempMin = data.daily.temperature_2m_min;

          // Recorremos cada día del pronóstico y lo añadimos al HTML
          for (let i = 0; i < times.length; i++) {
            forecastHTML += `
              <p><strong>${times[i]}:</strong> Máx: ${tempMax[i]}°C, Mín: ${tempMin[i]}°C</p>
            `;
          }
          displayResult(forecastHTML);
          // Guardamos la búsqueda en la base de datos
          saveSearch("Pronóstico 15 Días", city, forecastHTML);
        });
    })
    .catch(error => {
      displayResult("Error: " + error.message);
    });
}

// 3. Mostrar el mapa de la localidad usando Google Maps
function showMap() {
  const city = getCity();
  displayResult(`Buscando la localidad "${city}"...`);

  geocodeCity(city)
    .then(location => {
      const lat = location.lat;
      const lon = location.lon;
      
      // Se utiliza un iframe de Google Maps para mostrar el mapa centrado en las coordenadas
      const mapHTML = `
        <h3>Mapa de ${location.display_name}</h3>
        <iframe width="100%" height="450" frameborder="0" style="border:0"
          src="https://maps.google.com/maps?q=${lat},${lon}&t=&z=13&ie=UTF8&iwloc=&output=embed" allowfullscreen>
        </iframe>
      `;
      displayResult(mapHTML);
      // Guardamos la búsqueda en la base de datos
      saveSearch("Mapa", city, mapHTML);
    })
    .catch(error => {
      displayResult("Error: " + error.message);
    });
}

/* ------------------------- Funciones para el historial ------------------------- */

// Función para obtener el historial de búsquedas desde el servidor
function getHistory() {
  // Se realiza una petición GET al endpoint del back‑end que devuelve el historial
  fetch("/api/history")
    .then(response => response.json())
    .then(data => {
      let historyHTML = `<h3>Historial de Búsquedas</h3>`;
      if (data.length === 0) {
        historyHTML += `<p>No hay búsquedas registradas para tu IP.</p>`;
      } else {
        // Recorremos los registros y los mostramos
        data.forEach(item => {
          historyHTML += `
            <div class="history-item">
              <p><strong>Fecha:</strong> ${item.timestamp}</p>
              <p><strong>Ciudad:</strong> ${item.city}</p>
              <p><strong>Tipo:</strong> ${item.search_type}</p>
              <p><strong>Resultado:</strong> ${item.result}</p>
              <hr>
            </div>
          `;
        });
      }
      displayResult(historyHTML);
    })
    .catch(error => {
      displayResult("Error al obtener el historial: " + error.message);
    });
}

// Función para enviar (guardar) la búsqueda al back‑end
function saveSearch(searchType, city, resultHTML) {
  // Se envía una petición POST con los datos de la búsqueda
  fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    // Los datos se envían en formato JSON
    body: JSON.stringify({
      search_type: searchType,
      city: city,
      result: resultHTML
    })
  })
  .then(response => response.json())
  .then(data => {
    // Se puede mostrar un mensaje o simplemente ignorar la respuesta
    console.log("Búsqueda guardada:", data);
  })
  .catch(error => {
    console.error("Error al guardar la búsqueda:", error);
  });
}
