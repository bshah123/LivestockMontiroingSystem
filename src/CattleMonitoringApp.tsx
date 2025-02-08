import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import alertSound from './level-up-191997.mp3';
import './App.css';  // Assuming App.css for additional styling

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CattleMonitoringApp = () => {
  const [selectedSetup, setSelectedSetup] = useState('Cattle1');
  const [viewMode, setViewMode] = useState('history'); 
  const [fullData, setFullData] = useState({});
  const [lastData, setLastData] = useState([]);
  const [numEntries, setNumEntries] = useState(10);
  const [alertMessage, setAlertMessage] = useState(null);

  const sheetIds = {
    Cattle1: '1AAhn_PEXCgodW1nTxzho8V-3dUt6gxA0nN9ANmnyQy8',
    Cattle2: '1ZNzp7X3n8CkrgQbqVauzQ7M4MFo9jE4D7w9Ydgcm2Rk',
    Cattle3: '1Q8fjbs-joMjJJIaPmwmEUORiH5T6-BpEQMHXU8ilgtM',
    Cattle4: '1ATvo4cnVuxSlhGiJZUE4tIh-NCDUD_1AvI511f5vZBU',
    Cattle5: '1hOPMBxl2_V6rg0uW276gKVNlfC3GDZZmWCwBXaEfKJc',
  };

  const fetchDataForAllSetups = async () => {
    const fetchPromises = Object.keys(sheetIds).map(async (setup) => {
      const sheetId = sheetIds[setup];
      const apiKey = `AIzaSyCfa1d2kbuJ1Hu1kSMp5e50-F7T-9adIk8`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:J?key=${apiKey}`;

      try {
        const response = await fetch(url);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to fetch data');

        const rows = result.values || [];
        const data = rows.slice(1).map((row) => ({
          time: row[0],
          accelerometerX: parseFloat(row[1]) || 0,
          accelerometerY: parseFloat(row[2]) || 0,
          accelerometerZ: parseFloat(row[3]) || 0,
          gyroscopicX: parseFloat(row[4]) || 0,
          gyroscopicY: parseFloat(row[5]) || 0,
          gyroscopicZ: parseFloat(row[6]) || 0,
          temperature: parseFloat(row[7]) || 0,
          latitude: parseFloat(row[8]) || 0,
          longitude: parseFloat(row[9]) || 0,
        }));

        setFullData((prevData) => ({ ...prevData, [setup]: data }));
        return data[data.length - 1];
      } catch (error) {
        console.error('Error fetching data:', error);
        return null;
      }
    });

    return await Promise.all(fetchPromises);
  };

  const updateDataForSelectedSetup = () => {
    if (fullData[selectedSetup]) {
      const dataForSetup = fullData[selectedSetup].slice(-numEntries);
      setLastData(dataForSetup);
    }
  };

  useEffect(() => {
    updateDataForSelectedSetup();
  }, [selectedSetup, numEntries, fullData]);

  const checkForAnomalies = async (dataPoints) => {
    const anomalyPromises = dataPoints.map(async (dataPoint, index) => {
      if (dataPoint) {
        try {
          console.log('Sending data for anomaly detection:', dataPoint);
          const response = await fetch('http://127.0.0.1:5000/detect_anomaly', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: Object.values(dataPoint).slice(1), setup: Object.keys(sheetIds)[index] }), 
          });
          const result = await response.json();
          console.log('Received result from anomaly detection:', result);
          if (result.alert) {
            setAlertMessage(`Anomaly detected in ${Object.keys(sheetIds)[index]}!`);
            const audio = new Audio(alertSound);
            audio.play();
            setTimeout(() => setAlertMessage(null), 5000);
          }
        } catch (error) {
          console.error('Error checking anomaly:', error);
        }
      }
    });

    await Promise.all(anomalyPromises);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      const latestDataPoints = await fetchDataForAllSetups();
      await checkForAnomalies(latestDataPoints);
    }, 10000); 

    return () => clearInterval(interval);
  }, []);

  const handleNumEntriesChange = (event) => {
    const value = Math.max(1, parseInt(event.target.value, 10));
    setNumEntries(value);
  };

  const renderGraph = (label, dataKey, color) => {
    const data = {
      labels: lastData.map((d) => d.time),
      datasets: [{ label, data: lastData.map((d) => d[dataKey]), borderColor: color, fill: false }],
    };
    const options = { responsive: true, maintainAspectRatio: false, scales: { x: { display: true }, y: { display: true } } };
    return <div className="graph-card"><Line data={data} options={options} /></div>;
  };

  const renderMap = () => {
    const mapData = viewMode === 'history' ? lastData : [lastData[lastData.length - 1]];
    const path = mapData.map((d) => ({ lat: d.latitude, lng: d.longitude }));

    return (
      <MapContainer center={path[0] || [29.864, 77.900]} zoom={18} style={{ width: '100%', height: '500px' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {viewMode === 'history' && (
          <Polyline positions={path} pathOptions={{ color: '#FF0000', weight: 2.8 }} />
        )}
        {mapData.map((d, index) => (
          <Marker
            key={index}
            position={[d.latitude, d.longitude]}
            icon={L.icon({ iconUrl: index === mapData.length - 1 ? 'https://i.ibb.co/x6sTCBb/d6f4c4f5-cdba-46c4-8850-1def6e5932d5-6-removebg-preview.png' : 'https://cdn-icons-png.flaticon.com/512/1998/1998610.png', iconSize: index === mapData.length - 1 ? [45, 45] : [20, 30] })}
          >
            <Popup>
              <div><strong>Time:</strong> {d.time}<br /><strong>Temperature:</strong> {d.temperature}°C</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    );
  };

  return (
    <div className="flex min-h-screen">
      <div className="w-1/4 bg-gray-100 p-6 shadow-lg">
        <h2 className="text-3xl font-semibold mb-6 text-blue-600">Cattle Monitoring System</h2>
        <div className="mb-6">
          <button
            className={`w-full mb-2 py-2 rounded ${viewMode === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('history')}
          >
            View History
          </button>
          <button
            className={`w-full mb-6 py-2 rounded ${viewMode === 'instantaneous' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setViewMode('instantaneous')}
          >
            View Instantaneous
          </button>
        </div>
        <label className="block font-semibold mb-2 text-gray-700">Select Setup:</label>
        <select className="w-full mb-6 p-2 rounded border border-gray-300" value={selectedSetup} onChange={(e) => setSelectedSetup(e.target.value)}>
          {Object.keys(sheetIds).map((setup) => (
            <option key={setup} value={setup}>{setup}</option>
          ))}
        </select>
        {viewMode === 'history' && (
          <div>
            <label className="block font-semibold mb-2 text-gray-700">Entries to display:</label>
            <input type="number" className="w-full mb-4 p-2 rounded border border-gray-300" value={numEntries} onChange={handleNumEntriesChange} />
          </div>
        )}
      </div>
      <div className="w-3/4 p-6">
        {alertMessage && (
          <div className="alert-box mb-4 px-4 py-3 rounded-md text-red-800 bg-red-200 border border-red-400">{alertMessage}</div>
        )}
        <h2 className="text-2xl font-semibold mb-4">Selected Setup: {selectedSetup}</h2>
        {viewMode === 'history' && (
          <div className="grid grid-cols-2 gap-6">
            {renderGraph('Accelerometer X', 'accelerometerX', '#42A5F5')}
            {renderGraph('Accelerometer Y', 'accelerometerY', '#66BB6A')}
            {renderGraph('Accelerometer Z', 'accelerometerZ', '#FFA726')}
            {renderGraph('Gyroscopic X', 'gyroscopicX', '#26C6DA')}
            {renderGraph('Gyroscopic Y', 'gyroscopicY', '#FF7043')}
            {renderGraph('Gyroscopic Z', 'gyroscopicZ', '#AB47BC')}
            {renderGraph('Temperature', 'temperature', '#78909C')}
          </div>
        )}
        {viewMode === 'instantaneous' && (
          <div className="grid grid-cols-2 gap-4">
            {lastData.slice(-1).map((d, i) => (
              <div key={i} className="data-card p-4 shadow-lg rounded-lg bg-gray-100">
                <h3 className="text-lg font-semibold mb-2">Time: {d.time}</h3>
                <p className="mb-1"><strong>Accelerometer X:</strong> {d.accelerometerX}</p>
                <p className="mb-1"><strong>Accelerometer Y:</strong> {d.accelerometerY}</p>
                <p className="mb-1"><strong>Accelerometer Z:</strong> {d.accelerometerZ}</p>
                <p className="mb-1"><strong>Gyroscope X:</strong> {d.gyroscopicX}</p>
                <p className="mb-1"><strong>Gyroscope Y:</strong> {d.gyroscopicY}</p>
                <p className="mb-1"><strong>Gyroscope Z:</strong> {d.gyroscopicZ}</p>
                <p className="mb-1"><strong>Temperature:</strong> {d.temperature}°C</p>
                <p><strong>Location:</strong> {d.latitude}, {d.longitude}</p>
              </div>
            ))}
          </div>
        )}
        {renderMap()}
      </div>
    </div>
  );
};

export default CattleMonitoringApp;
