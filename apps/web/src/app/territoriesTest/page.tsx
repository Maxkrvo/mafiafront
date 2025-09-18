"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Header } from "@/components/navigation/Header";

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: calc(100vh - 147px); /* Account for header height */
  flex: 1;
`;

const MapElement = styled.div`
  width: 100%;
  height: 100%;
`;

const SearchPanel = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 280px;
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 768px) {
    width: calc(100vw - 24px);
    left: 12px;
    right: 12px;
  }
`;

const SearchTitle = styled.h4`
  font-weight: bold;
  margin-bottom: 8px;
  margin: 0 0 8px 0;
`;

const SearchInput = styled.input`
  width: 100%;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 12px;
  outline: none;
  background: rgba(249, 250, 251, 0.8);
  transition: all 0.2s ease;
  font-size: 14px;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    transform: scale(1.02);
  }

  &:hover:not(:focus) {
    background: rgba(243, 244, 246, 0.9);
  }
`;

const ResultsContainer = styled.div`
  margin-top: 8px;
  max-height: 192px;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  cursor: pointer;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: all 0.15s ease;
  font-size: 14px;
  border-left: 3px solid transparent;

  &:hover {
    background: linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.1) 0%,
      rgba(249, 250, 251, 0.8) 100%
    );
    border-left-color: #3b82f6;
    transform: translateX(4px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &:active {
    transform: translateX(2px) scale(0.98);
  }
`;

const NoResults = styled.div`
  padding: 8px;
  color: #6b7280;
  text-align: center;
`;

const DownloadContainer = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
`;

const DownloadButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 14px;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 20px 25px -5px rgba(102, 126, 234, 0.4),
      0 10px 10px -5px rgba(118, 75, 162, 0.3);

    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-1px) scale(1.02);
  }
`;

export default function AmsterdamNeighborhoodsMap() {
  const mapRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [query, setQuery] = useState("");

  const AMSTERDAM_NEIGHBORHOODS_URL =
    "https://maps.amsterdam.nl/open_geodata/geojson_lnglat.php?KAARTLAAG=INDELING_BUURT&THEMA=gebiedsindeling";

  // Color function
  function getColor(name) {
    if (!name) return "#cccccc";
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const colors = [
      "#f7fbff",
      "#deebf7",
      "#c6dbef",
      "#9ecae1",
      "#6baed6",
      "#3182bd",
      "#08519c",
    ];
    return colors[Math.abs(hash) % colors.length];
  }

  // Styling function
  function style(feature) {
    return {
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.7,
      fillColor: getColor(feature.properties.Naam || feature.properties.naam),
    };
  }

  useEffect(() => {
    let L;

    const initMap = async () => {
      // Dynamic import to avoid SSR issues
      L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      // Fix default marker icons for webpack
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      if (!mapRef.current) {
        mapRef.current = L.map("map").setView([52.370216, 4.895168], 11);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(mapRef.current);
      }

      fetch(AMSTERDAM_NEIGHBORHOODS_URL)
        .then((r) => r.json())
        .then((data) => {
          data.features.forEach((f) => {
            const p = f.properties || {};
            f.properties.Naam = p.Naam || p.naam || p.NAAM || p.name || p.Naam;
          });

          function highlightFeature(e) {
            const layer = e.target;
            layer.setStyle({
              weight: 3,
              color: "#666",
              dashArray: "",
              fillOpacity: 0.9,
            });
            layer.bringToFront();
          }

          function resetHighlight(e) {
            geojsonLayerRef.current?.resetStyle(e.target);
          }

          function zoomToFeature(e) {
            mapRef.current?.fitBounds(e.target.getBounds(), {
              padding: [20, 20],
            });
            const props = e.target.feature.properties;
            const name = props.Naam || props.naam || "Unknown";
            const html =
              "<h4>" +
              name +
              "</h4>" +
              Object.keys(props)
                .map((k) => "<div><b>" + k + "</b>: " + props[k] + "</div>")
                .join("");
            e.target.bindPopup(html).openPopup();
          }

          function onEachFeature(feature, layer) {
            layer.on({
              mouseover: highlightFeature,
              mouseout: resetHighlight,
              click: zoomToFeature,
            });
          }

          if (geojsonLayerRef.current) {
            geojsonLayerRef.current.remove();
          }

          geojsonLayerRef.current = L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature,
          }).addTo(mapRef.current);

          setNeighborhoods(
            data.features.map((f) => ({
              name: f.properties.Naam || "Unknown",
              id: f.properties.ID || f.properties.id,
              bounds: L.geoJSON(f).getBounds(),
            }))
          );

          mapRef.current?.fitBounds(geojsonLayerRef.current.getBounds(), {
            padding: [20, 20],
          });
        });
    };

    initMap();
  }, []);

  const filtered = query
    ? neighborhoods.filter((n) =>
        n.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSelect = (match) => {
    mapRef.current?.fitBounds(match.bounds, { padding: [20, 20] });
    geojsonLayerRef.current?.eachLayer((layer) => {
      if (
        (layer.feature.properties.Naam || layer.feature.properties.naam) ===
        match.name
      ) {
        layer.fire("click");
      }
    });
  };

  return (
    <MapContainer>
      <MapElement id="map" />
      <SearchPanel>
        <SearchTitle>Amsterdam neighborhoods</SearchTitle>
        <SearchInput
          placeholder="Search neighborhood"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ResultsContainer>
          {filtered.map((m) => (
            <ResultItem key={m.id} onClick={() => handleSelect(m)}>
              {m.name}
            </ResultItem>
          ))}
          {query && filtered.length === 0 && <NoResults>No matches</NoResults>}
        </ResultsContainer>
      </SearchPanel>
    </MapContainer>
  );
}
