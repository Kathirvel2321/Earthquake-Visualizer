import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import "./App.css";

// Fix default marker icon (Leaflet bug in React)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Change map view when a new EQ is selected
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [timeRange, setTimeRange] = useState("day");
  const [minMag, setMinMag] = useState(4.5);
  const [selectedEq, setSelectedEq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeRange, minMag]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let magFeed = "all"; // default
      if (minMag >= 4.5) magFeed = "4.5";
      else if (minMag >= 2.5) magFeed = "2.5";
      else if (minMag >= 1.0) magFeed = "1.0";
      else magFeed = "all";

      const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${magFeed}_${timeRange}.geojson`;
      const response = await axios.get(url);

      const features = response.data.features.map((eq) => ({
        id: eq.id,
        place: eq.properties.place,
        mag: eq.properties.mag,
        time: new Date(eq.properties.time).toLocaleString(),
        coordinates: [eq.geometry.coordinates[1], eq.geometry.coordinates[0]],
      }));

      setEarthquakes(features);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Header */}
      <motion.header
        className="header"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <h1> Earthquake Visualizer</h1>
      </motion.header>

      <div className="main">
        {/* Sidebar */}
        <motion.div
          className="sidebar"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <h2>Recent Earthquakes</h2>

          <label>Time Range</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="hour">Past Hour</option>
            <option value="day">Past Day</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>

          <label>Min Magnitude</label>
          <input
            type="number"
            value={minMag}
            step="0.1"
            onChange={(e) => setMinMag(e.target.value)}
          />

          <div className="eq-list">
            {loading ? (
              <p>⏳ Loading earthquakes...</p>
            ) : (
              earthquakes.map((eq, i) => (
                <motion.div
                  key={eq.id}
                  className={`eq-item ${
                    selectedEq?.id === eq.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedEq(eq)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <strong>{eq.place}</strong>
                  <p className="mag">Magnitude: {eq.mag}</p>
                  <p className="time">{eq.time}</p>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="content">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2>Magnitude Chart</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={earthquakes}>
                <XAxis dataKey="place" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="mag" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Map */}
          <motion.div
            className="map-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: "400px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {selectedEq && (
                <>
                  <ChangeView center={selectedEq.coordinates} zoom={5} />
                  <Marker position={selectedEq.coordinates}>
                    <Popup>
                      <b>{selectedEq.place}</b>
                      <br />
                      Magnitude: {selectedEq.mag}
                      <br />
                      {selectedEq.time}
                    </Popup>
                  </Marker>
                </>
              )}
            </MapContainer>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
