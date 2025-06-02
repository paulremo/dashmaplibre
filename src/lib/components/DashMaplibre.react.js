import React, { useRef, useEffect, useState} from "react";
import PropTypes from "prop-types";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css'; // Make sure your webpack config handles CSS
import * as d3 from "d3";


const areLayersEqual = (layerA, layerB) => {
    return JSON.stringify(layerA) === JSON.stringify(layerB);
};

const D3Colorbar = ({
    stops,
    title,
    labels = {},
    barHeight = 24,
    titleHeight = 24,
    labelHeight = 24,
    ...props
}) => {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(0);
    const svgRef = useRef(null);

    // Use ResizeObserver for responsive sizing
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new window.ResizeObserver(entries => {
            for (let entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        ro.observe(containerRef.current);

        // Initial set
        setWidth(containerRef.current.offsetWidth || 0);

        return () => {
            ro.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!stops || !width) return;
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Process stops
        const entries = Object.entries(stops)
            .map(([v, colors]) => [parseFloat(v), colors])
            .sort((a, b) => a[0] - b[0]);
        const values = entries.map(([v]) => v);
        const colors = entries.map(([, c]) => c);

        // Scale value to position
        const scale = d3.scaleLinear()
            .domain([Math.min(...values), Math.max(...values)])
            .range([0, width]);

        // Define gradient
        const defs = svg.append("defs");
        const gradId = "grad-" + Math.random().toString(36).substr(2, 9);
        const grad = defs.append("linearGradient")
            .attr("id", gradId)
            .attr("x1", "0%").attr("x2", "100%")
            .attr("y1", "0%").attr("y2", "0%");

        for (let i = 0; i < entries.length; ++i) {
            const pos = scale(entries[i][0]) / width * 100;
            grad.append("stop")
                .attr("offset", `${pos}%`)
                .attr("stop-color", colors[i][0]);
            grad.append("stop")
                .attr("offset", `${pos}%`)
                .attr("stop-color", colors[i][1]);
        }

        // Draw colorbar
        svg.append("rect")
            .attr("x", 0).attr("y", titleHeight)
            .attr("width", width)
            .attr("height", barHeight)
            .style("fill", `url(#${gradId})`)
            .style("stroke", "#444")
            .style("stroke-width", 1);

        // Draw labels (optional)
        Object.entries(labels).forEach(([pos, text]) => {
            const p = Math.max(0, Math.min(1, parseFloat(pos)));
            const xpos = p * width;
            let anchor = "middle";
            if (p <= 0.05) anchor = "start";
            else if (p >= 0.95) anchor = "end";
            svg.append("text")
                .attr("x", xpos)
                .attr("y", titleHeight + barHeight + labelHeight / 2)
                .attr("text-anchor", anchor)
                .attr("font-size", 12)
                .attr("fill", "#222")
                .attr("dominant-baseline", "middle")
                .text(text);
        });

        // Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", titleHeight / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", 14)
            .attr("fill", "#222")
            .attr("dominant-baseline", "middle")
            .text(title);

    }, [stops, labels, title, barHeight, width]);

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <svg
                ref={svgRef}
                width={width || 1}
                height={titleHeight + barHeight + labelHeight}
                style={{ display: "block"}}
            />
        </div>
    );
};


const DashMaplibre = ({
    id,
    styleUrl = "https://demotiles.maplibre.org/style.json",
    center = [0, 0],
    zoom = 2,
    bearing = 0,
    pitch = 0,
    sources = {},
    layers = [],
    style = {},
    colorbar_map = {},
    colorbar_risk = {},
    setProps,
    ...otherProps    
}) => {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const prevLayersRef = useRef([]);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = new maplibregl.Map({
                container: mapContainer.current,
                style: styleUrl,
                center,
                zoom,
                bearing,
                pitch,
                ...otherProps
            });

            mapRef.current.on('load', () => {
                // Add sources and layers
                Object.entries(sources).forEach(([id, src]) => {
                    mapRef.current.addSource(id, src);
                });
                layers.forEach(layer => {
                    mapRef.current.addLayer(layer);
                });
            });

            // Example: Send click events back to Dash
            mapRef.current.on('click', (e) => {
                if (setProps) {
                    setProps({ clickData: e.lngLat });
                }
            });
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update sources
    useEffect(() => {
        if (!mapRef.current) return;
        Object.entries(sources).forEach(([id, src]) => {
            if (mapRef.current.getSource(id)) {
                if (src.type === "geojson") {
                    mapRef.current.getSource(id).setData(src.data);
                }
            }
        });
    }, [sources]);

    // Update layers
    useEffect(() => {
        if (!mapRef.current) return;
        const map = mapRef.current;

        // Get previous and current layer IDs
        const prevLayers = prevLayersRef.current;
        const prevLayerIds = new Set(prevLayers.map(l => l.id));
        const currLayerIds = new Set(layers.map(l => l.id));

        // 1. Remove layers no longer present
        prevLayers.forEach(layer => {
            if (!currLayerIds.has(layer.id) && map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
            }
        });

        // 2. Add new layers and update changed layers
        layers.forEach((layer, idx) => {
            const onMap = map.getLayer(layer.id);
            const prevLayer = prevLayers.find(l => l.id === layer.id);

            if (!onMap) {
                // Add at the correct index for ordering
                // Find the layer after this one (if any) to insert before it
                let beforeId = null;
                for (let i = idx + 1; i < layers.length; i++) {
                    if (map.getLayer(layers[i].id)) {
                        beforeId = layers[i].id;
                        break;
                    }
                }
                try {
                    map.addLayer(layer, beforeId);
                } catch (err) {
                    // Sometimes MapLibre throws if source doesn't exist yet, can retry later
                    // Optionally add error handling
                }
            } else if (!areLayersEqual(layer, prevLayer)) {
                // If the layer definition has changed, remove and re-add
                map.removeLayer(layer.id);
                // See above for ordering logic
                let beforeId = null;
                for (let i = idx + 1; i < layers.length; i++) {
                    if (map.getLayer(layers[i].id)) {
                        beforeId = layers[i].id;
                        break;
                    }
                }
                try {
                    map.addLayer(layer, beforeId);
                } catch (err) {
                    // Handle errors (e.g., source not yet available)
                }
            }
            // else: nothing to do, layer is up-to-date
        });

        // Save current layers as previous for next effect run
        prevLayersRef.current = layers;

    }, [layers]);
    
    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", ...style }}>
            <div style={{ display: "flex", flexDirection: "row", gap: 24, justifyContent: "center", margin: "0 8px" }}>
                {colorbar_map && <D3Colorbar {...colorbar_map} />}
                {colorbar_risk && <D3Colorbar {...colorbar_risk} />}
            </div>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
                {/* Map container */}
                <div
                    id={id}
                    ref={mapContainer}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
        </div>
    );
};

DashMaplibre.propTypes = {
    id: PropTypes.string,
    styleUrl: PropTypes.string,
    center: PropTypes.array,
    zoom: PropTypes.number,
    bearing: PropTypes.number,
    pitch: PropTypes.number,
    sources: PropTypes.object,
    layers: PropTypes.array,
    style: PropTypes.object,
    colorbar_map: PropTypes.object,
    colorbar_risk: PropTypes.object,
    setProps: PropTypes.func,
};

export default DashMaplibre;

