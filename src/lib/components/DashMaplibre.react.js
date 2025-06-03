import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import Colorbar from './Colorbar.react.js';

const EMPTY_STYLE = {
  version: 8,
  sources: {},
  layers: []
};


const areLayersEqual = (layerA, layerB) => {
    return JSON.stringify(layerA) === JSON.stringify(layerB);
};


function interpolateTemplate(template, props) {
    // Match {key} or {key:.2f} or {key:.2e}
    return template.replace(/\{(\w+)(?::([.\d\w]+))?\}/g, (match, key, format) => {
        const value = props[key];
        if (value === null) {return '';}
        if (format && typeof value === 'number') {
            // .2f (fixed-point)
            const fixedMatch = format.match(/^\.([0-9]+)f$/);
            if (fixedMatch) {
                const decimals = parseInt(fixedMatch[1], 10);
                return value.toFixed(decimals);
            }
            // .2e (exponential)
            const expMatch = format.match(/^\.([0-9]+)e$/);
            if (expMatch) {
                const decimals = parseInt(expMatch[1], 10);
                return value.toExponential(decimals);
            }
        }
        return String(value);
    });
}


/**
 * DashMaplibre Component
 *
 * A component exposing the MapLibre GL JS library for use in Dash applications.
 */
const DashMaplibre = ({
    id,
    basemap = EMPTY_STYLE,
    center = [0, 0],
    zoom = 2,
    max_bounds = null,
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
    const [visibleLayers, setVisibleLayers] = useState(() => layers.filter(l => l.display_name).map(l => l.id));
    const savedViewRef = useRef({ center, zoom });

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) {
            mapRef.current = new maplibregl.Map({
                container: mapContainer.current,
                style: basemap,
                center,
                zoom,
                bearing,
                pitch,
                maxBounds: max_bounds,
                ...otherProps
            });

            // Expose map instance for debugging
            window._map = mapRef.current;

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

    useEffect(() => {
        if (!mapRef.current) {
            return () => {};
        }
        const map = mapRef.current;

        function handleDblClick(e) {
            if (savedViewRef.current) {
                map.setCenter(savedViewRef.current.center);
                map.setZoom(savedViewRef.current.zoom);
            }
        }

        map.on('dblclick', handleDblClick);
        return () => {
            map.off('dblclick', handleDblClick);
        };
    }, []);

    // Keep visibility in sync with map
    useEffect(() => {
        if (!mapRef.current) {return;}
        layers.forEach(layer => {
            if (!layer.display_name) {return;}
            if (mapRef.current.getLayer(layer.id)) {
                mapRef.current.setLayoutProperty(
                    layer.id,
                    "visibility",
                    visibleLayers.includes(layer.id) ? "visible" : "none"
                );
            }
        });
    }, [visibleLayers, layers]);

    // When layers prop changes, sync visibleLayers state (preserving toggled-off)
    useEffect(() => {
        setVisibleLayers(vs => {
            const validIds = layers.filter(l => l.display_name).map(l => l.id);
            // By default, show new layers, and preserve hidden state for previous layers
            const newVisible = [...vs];
            validIds.forEach(id => {
                if (!newVisible.includes(id)) {newVisible.push(id);}
            });
            // Remove IDs that are no longer present
            return newVisible.filter(id => validIds.includes(id));
        });
    }, [layers]);

    // Update sources
    useEffect(() => {
        if (!mapRef.current) {return;}
        const map = mapRef.current;
        Object.entries(sources).forEach(([id, src]) => {
            if (!map.getSource(id)) {
                try {
                    map.addSource(id, src);
                } catch (err) {
                    // Optionally log error
                }
            } else if (src.type === "geojson") {
                map.getSource(id).setData(src.data);
            }
        });
    }, [sources]);

    // Update basemap style if the basemap prop changes
    useEffect(() => {
        if (!mapRef.current) {return;}
        // Only update if the style actually changes
        const map = mapRef.current;
        // Accept both URL and object for basemap
        if (typeof basemap === "string" || typeof basemap === "object") {
            map.setStyle(basemap);
        }
    }, [basemap]);

    // Update layers
    useEffect(() => {
        if (!mapRef.current) {
            return () => {};
        }
        const map = mapRef.current;
        let retryTimeout = null;

        function updateSourcesAndLayers() {
            // 1. Add sources
            console.debug("Updating sources and layers");
            Object.entries(sources).forEach(([id, src]) => {
                if (!map.getSource(id)) {
                    try { map.addSource(id, src); } catch (err) {}
                } else if (src.type === "geojson") {
                    map.getSource(id).setData(src.data);
                }
            });

            // 2. Remove layers no longer present
            console.debug("Removing old layers");
            const prevLayers = prevLayersRef.current;
            const currLayerIds = new Set(layers.map(l => l.id));
            prevLayers.forEach(layer => {
                if (!currLayerIds.has(layer.id) && map.getLayer(layer.id)) {
                    map.removeLayer(layer.id);
                }
            });

            // 3. Add new layers and update changed layers
            let skipped = false;
            layers.forEach((layer, idx) => {
                console.debug(`Processing layer ${layer.id} (${idx + 1}/${layers.length})`);
                const onMap = map.getLayer(layer.id);
                const prevLayer = prevLayers.find(l => l.id === layer.id);

                // Only add if source exists
                if (!map.getSource(layer.source)) {
                    console.debug(`Skipping layer ${layer.id} - source ${layer.source} not found`);
                    skipped = true;
                    return;
                }

                if (!onMap) {
                    console.debug(`Adding layer ${layer.id}`);
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
                        console.error(`Failed to add layer ${layer.id}:`, err, layer);
                    }
                } else if (!areLayersEqual(layer, prevLayer)) {
                    console.debug(`Updating layer ${layer.id}`);
                    map.removeLayer(layer.id);
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
                        console.error(`Failed to update layer ${layer.id}:`, err, layer);
                    }
                }
            });

            // Only update prevLayersRef when all layers processed
            if (skipped) {
                retryTimeout = setTimeout(updateSourcesAndLayers, 50);
            } else {
                prevLayersRef.current = layers;
            }
        }

 
        console.debug("Updating sources and layers (immediate call)");
        updateSourcesAndLayers();
        if (!map.isStyleLoaded()) {
            console.debug("Map style not loaded, also waiting for load event");
            map.once('load', updateSourcesAndLayers);
        }

        return () => {
            if (retryTimeout) {clearTimeout(retryTimeout);}
        };
    }, [layers, sources]);

    // Hover popups for all layers with hover_html
    useEffect(() => {
        if (!mapRef.current) {
            return () => {};
        }
        const map = mapRef.current;
        const popups = {};
        const handlers = {};

        // Attach listeners for each layer with hover_html
        layers.forEach(layer => {
            if (!layer.hover_html) { return; }
            const layerId = layer.id;
            const hoverHtml = layer.hover_html;

            function onMouseEnter(e) {
                map.getCanvas().style.cursor = 'pointer';
                const feature = e.features[0];
                const props = feature.properties;
                const html = interpolateTemplate(hoverHtml, props);
                if (!popups[layerId]) {
                    popups[layerId] = new maplibregl.Popup({ closeButton: false, closeOnClick: false });
                }
                popups[layerId]
                    .setLngLat(feature.geometry.coordinates)
                    .setHTML(html)
                    .addTo(map);
            }

            function onMouseLeave() {
                map.getCanvas().style.cursor = '';
                if (popups[layerId]) {
                    popups[layerId].remove();
                }
            }

            handlers[layerId] = { onMouseEnter, onMouseLeave };

            // Attach only if the layer exists
            if (map.getLayer(layerId)) {
                map.on('mouseenter', layerId, onMouseEnter);
                map.on('mouseleave', layerId, onMouseLeave);
            }
        });

        // Clean up: remove listeners and popups for removed layers
        return () => {
            layers.forEach(layer => {
                if (!layer.hover_html) { return; }
                const layerId = layer.id;
                const h = handlers[layerId];
                if (h && map.getLayer(layerId)) {
                    map.off('mouseenter', layerId, h.onMouseEnter);
                    map.off('mouseleave', layerId, h.onMouseLeave);
                }
                if (popups[layerId]) {
                    popups[layerId].remove();
                    delete popups[layerId];
                }
            });
        };
    }, [layers, sources]);

    // Update camera when center, zoom, bearing, or pitch change
    useEffect(() => {
        if (!mapRef.current) {return;}
        const map = mapRef.current;

        // Save latest prop-driven view
        if (center && typeof zoom === "number") {
            savedViewRef.current = { center, zoom };
        }

        // Only update if the value actually changed
        if (center) {
            const curr = map.getCenter();
            if (curr.lng !== center[0] || curr.lat !== center[1]) {
                map.setCenter(center);
            }
        }
        if (typeof zoom === "number" && map.getZoom() !== zoom) {
            map.setZoom(zoom);
        }
        if (typeof bearing === "number" && map.getBearing() !== bearing) {
            map.setBearing(bearing);
        }
        if (typeof pitch === "number" && map.getPitch() !== pitch) {
            map.setPitch(pitch);
        }
    }, [center, zoom, bearing, pitch]);

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", ...style }}>
            <div style={{ display: "flex", flexDirection: "row", gap: 24, justifyContent: "center", margin: "0 8px" }}>
                {colorbar_map && <Colorbar {...colorbar_map} />}
                {colorbar_risk && <Colorbar {...colorbar_risk} />}
            </div>
            <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}>
                {/* Legend container - now absolute top left, sharp edges */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    background: "#fff",
                    padding: 12,
                    borderRadius: 0,
                    zIndex: 10,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
                    minWidth: 120
                }}>
                    {layers.filter(l => l.display_name).map(layer => {
                        // Try to find the color from paint
                        let color =
                            layer.paint?.["circle-color"] ||
                            layer.paint?.["fill-color"] ||
                            layer.paint?.["line-color"] ||
                            "#ccc";
                        // If color is an array (expression), fallback to gray or improve extraction
                        if (Array.isArray(color)) { color = "#ccc"; }
                        return (
                            <div
                                key={layer.id}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    fontWeight: "normal",
                                    opacity: visibleLayers.includes(layer.id) ? 1 : 0.5,
                                    marginBottom: 5,
                                    userSelect: "none"
                                }}
                                onClick={() => {
                                    setVisibleLayers(vs =>
                                        vs.includes(layer.id)
                                            ? vs.filter(id => id !== layer.id)
                                            : [...vs, layer.id]
                                    );
                                }}
                                title={layer.id}
                            >
                                {/* Swatch */}
                                <span style={{
                                    display: "inline-block",
                                    width: 16,
                                    height: 16,
                                    borderRadius: 8,
                                    marginRight: 10,
                                    background: color,
                                    border: "1px solid #999"
                                }} />
                                <span>{layer.display_name}</span>
                            </div>
                        );
                    })}
                </div>
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
    /**
     * The ID of the component, used to identify it in Dash callbacks.
     */
    id: PropTypes.string,
    /**
     * The basemap URL or json.
     */
    basemap: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
    ]),
    /**
     * The center of the camera.
     */
    center: PropTypes.array,
     /**
     * The zoom level of the camera.
     */
    zoom: PropTypes.number,
    /**
     * The maximum bounds of the camera.
     */
    max_bounds: PropTypes.array,
    /**
     * The bearing of the camera.
     */
    bearing: PropTypes.number,
    /**
     * The pitch of the camera.
     */
    pitch: PropTypes.number,
    /**
     * The maplibre sources dictionary.
     */
    sources: PropTypes.object,
    /**
     * The maplibre layers list.
     */
    layers: PropTypes.array,
    /**
     * Additional style properties for the map container.
     */
    style: PropTypes.object,
    /**
     * Colorbar configuration for the map colorbar.
     */
    colorbar_map: PropTypes.object,
    /**
     * Colorbar configuration for the risk colorbar.
     */
    colorbar_risk: PropTypes.object,
    /**
     * The layer ID to attach hover events to.
     */
    hover_layer: PropTypes.string,
    /**
     * The HTML template for hover popups.
     * Use {property_name} to interpolate properties from the hovered feature.
     */
    hover_html: PropTypes.string,
    /**
     * Callback function to set properties in Dash.
     * This is called with the updated properties when the map state changes.
     */
    setProps: PropTypes.func,
};

export default DashMaplibre;

