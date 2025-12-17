/* eslint-disable consistent-return */
import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import PropTypes from "prop-types";
import maplibregl from "maplibre-gl";
import './DashMaplibre.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import Colorbar from './Colorbar.react.js';

const DEFAULT_LAYERS = [];
const DEFAULT_SOURCES = {};

const EMPTY_BASEMAP = {
  version: 8,
  name: "Empty",
  sources: {},
  layers: []
};

function interpolateTemplate(template, props) {
    return template.replace(/\{(\w+)(?::([.\d\w]+))?\}/g, (match, key, format) => {
        const value = props[key];
        if (value === null) {return '';}
        if (format && typeof value === 'number') {
            const fixedMatch = format.match(/^\.([0-9]+)f$/);
            if (fixedMatch) {
                const decimals = parseInt(fixedMatch[1], 10);
                return value.toFixed(decimals);
            }
            const expMatch = format.match(/^\.([0-9]+)e$/);
            if (expMatch) {
                const decimals = parseInt(expMatch[1], 10);
                return value.toExponential(decimals);
            }
        }
        return String(value);
    });
}

// Helper to get the correct colorbar config for the current zoom
function getColorbarForZoom(colorbar_map, zoom) {
    if (!colorbar_map) {return null;}
    if (typeof colorbar_map !== "object" || Array.isArray(colorbar_map)) {return colorbar_map;}

    const keys = Object.keys(colorbar_map);
    // Check if all keys are numeric (or can be parsed as numbers)
    const allNumeric = keys.length > 0 && keys.every(k => !isNaN(Number(k)));

    if (!allNumeric) {
        // Legacy style: treat as a single colorbar config
        return colorbar_map;
    }

    // colorbar_map is a dict: keys are zoom levels, values are colorbar configs
    const zoomKeys = keys
        .map(Number)
        .sort((a, b) => a - b);
    let chosen = null;
    for (let i = 0; i < zoomKeys.length; i++) {
        if (zoom >= zoomKeys[i]) {
            chosen = colorbar_map[zoomKeys[i]];
        } else {
            break;
        }
    }
    return chosen;
}

/**
    * DashMaplibre is a React component for displaying interactive maps using MapLibre GL JS.
    * It supports custom basemaps, layers, sources, and interactive features like hover popups and click events.
    * It is designed to be used within a Dash application, allowing for dynamic updates and interactivity.
    * 
    * Dependencies:
    * - maplibre-gl: For rendering maps and handling layers/sources.
    * - Colorbar: A custom component for displaying colorbars alongside the map.
    * - Mantine for styling and layout.
 */
const DashMaplibre = ({
    id,
    basemap = EMPTY_BASEMAP,
    center = [0, 0],
    zoom = 2,
    max_bounds = null,
    bearing = 0,
    pitch = 0,
    sources = {},
    layers = DEFAULT_LAYERS,
    style = DEFAULT_SOURCES,
    colorbar_map = null,
    colorbar_risk = null,
    setProps,
    version = "",
    feature_state = null,
    ...otherProps
}) => {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const prevLayersRef = useRef([]);
    const [visibleLayers, setVisibleLayers] = useState(() => layers.filter(l => l.display_name).map(l => l.id));
    const [styleLoaded, setStyleLoaded] = useState(false);
    const savedViewRef = useRef({ center, zoom });
    const legendLayers = layers.filter(l => l.display_name);
    const [currentZoom, setCurrentZoom] = useState(zoom);


    // 1. Initialize map only once
    useEffect(() => {
        console.log("Initializing MapLibre map");
        if (!mapRef.current) {
            mapRef.current = new maplibregl.Map({
                container: mapContainer.current,
                center,
                zoom,
                bearing,
                pitch,
                maxBounds: max_bounds,
                ...otherProps
            });
            window._map = mapRef.current;
        }
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // 2. Handle basemap (style) changes
    useLayoutEffect(() => {
        if (!mapRef.current) {return;}

        console.log("Updating basemap/style");
        const map = mapRef.current;
        setStyleLoaded(false);
        prevLayersRef.current = [];

        function onIdle() {
            console.log("Basemap/style loaded");
            setStyleLoaded(true);
        }
        map.once('idle', onIdle);
        map.setStyle(basemap);
    }, [basemap]);

    // 3. Add/update sources after style is loaded
    useEffect(() => {
        if (!mapRef.current || !styleLoaded) {return;}

        console.log("Updating sources");
        const map = mapRef.current;
        Object.entries(sources).forEach(([id, src]) => {
            // Safety: skip empty or invalid geojson sources
            if (
                src &&
                src.type === "geojson" &&
                (
                    !src.data ||
                    typeof src.data !== "object" ||
                    Object.keys(src.data).length === 0 ||
                    !src.data.type
                )
            ) {
                // Skip invalid/empty geojson
                return;
            }

            // Add source if missing, or update data if geojson source already exists
            if (!map.getSource(id)) {
                try { map.addSource(id, src); } catch (err) {
                console.error(err);
            }
            } else if (src.type === "geojson") {
                console.log("Updating geojson source data for:", id);
                map.getSource(id).setData(src.data);
            }
        });
    }, [sources, styleLoaded]);

    // 4. Add/remove/update app layers after style and sources are ready
    useEffect(() => {
        if (!mapRef.current || !styleLoaded) {return;}

        console.log("Updating layers");
        const map = mapRef.current;

        // Remove app layers whose source is missing or which are no longer in the layers prop
        prevLayersRef.current.forEach(layer => {
            const sourceExists = Boolean(map.getSource(layer.source));
            const stillInLayers = layers.some(l => l.id === layer.id);
            if ((!sourceExists || !stillInLayers) && map.getLayer(layer.id)) {
                map.removeLayer(layer.id);
            }
        });

        // Add app layers whose source exists and which are not already on the map
        layers.forEach((layer, idx) => {
            if (Object.keys(layer).length === 0) {
                // Empty layer definition, skip
                return;
            }
            const sourceExists = Boolean(map.getSource(layer.source));
            if (!sourceExists) {
                console.warn("[DashMaplibre] Not adding app layer (missing source):", layer.id, "source:", layer.source);
                return;
            }
            if (!map.getLayer(layer.id)) {
                // Find the next layer in the list that is already on the map to insert before
                let beforeId = null;
                for (let i = idx + 1; i < layers.length; i++) {
                    if (map.getLayer(layers[i].id)) {
                        beforeId = layers[i].id;
                        break;
                    }
                }
                try { map.addLayer(layer, beforeId); } catch (err) { console.warn("addLayer failed", layer.id, err); }
            }
            // Patch properties for all existing layers
            patchLayerProperties(map, layer);
        });

        // Update prevLayersRef to only track app layers
        prevLayersRef.current = layers.slice();

        // Jump to savedViewRef
        map.jumpTo({
            center: savedViewRef.current.center,
            zoom: savedViewRef.current.zoom,
            bearing: 0,
            pitch: 0,
        })

        // Dispatch a DOM event to signal that layers have been updated
        const event = new CustomEvent('layers-updated', {
            detail: { message: 'Layers have been updated' },
        });
        window.dispatchEvent(event);
    }, [layers, sources, styleLoaded]);

    // 4b. Apply feature-state once style and sources are ready
    useEffect(() => {
        if (!mapRef.current || !styleLoaded || !feature_state) { return; }

        console.log("Applying feature_state");
        const map = mapRef.current;

        try {
            Object.entries(feature_state).forEach(([sourceId, layersForSource]) => {
                if (!map.getSource(sourceId)) {
                    console.warn("[DashMaplibre] feature_state: source missing:", sourceId);
                    return;
                }

                // layersForSource: { [sourceLayerId]: { [stateKey]: { [featureId]: value } } }
                Object.entries(layersForSource || {}).forEach(([sourceLayerId, stateMap]) => {
                    // stateMap: { [stateKey]: { [featureId]: value } }
                    Object.entries(stateMap || {}).forEach(([stateKey, featuresMap]) => {
                        // featuresMap: { [featureId]: value }
                        Object.entries(featuresMap || {}).forEach(([featureId, value]) => {
                            // Convention: null/undefined => clear this key for this feature
                            if (value === null || typeof value === "undefined") {
                                try {
                                    map.removeFeatureState(
                                        {
                                            source: sourceId,
                                            sourceLayer: sourceLayerId,
                                            id: featureId
                                        },
                                        stateKey
                                    );
                                } catch (err) {
                                    console.warn(
                                        "removeFeatureState failed",
                                        sourceId,
                                        sourceLayerId,
                                        featureId,
                                        stateKey,
                                        err
                                    );
                                }
                                return;
                            }

                            try {
                                map.setFeatureState(
                                    {
                                        source: sourceId,
                                        sourceLayer: sourceLayerId,
                                        id: featureId
                                    },
                                    { [stateKey]: value }
                                );
                            } catch (err) {
                                console.warn(
                                    "setFeatureState failed",
                                    sourceId,
                                    sourceLayerId,
                                    featureId,
                                    stateKey,
                                    err
                                );
                            }
                        });
                    });
                });
            });
        } catch (err) {
            console.error("Error applying feature_state", err);
        }
    }, [feature_state, sources, layers, styleLoaded]);


    // 5. Hover popups for layers with hover_html
    useEffect(() => {
        if (!mapRef.current) {return;}
        
        console.log("Setting up hover popups");
        const map = mapRef.current;
        let popup = null;

        // Collect all layer ids with hover_html
        const hoverLayers = layers.filter(l => l.hover_html).map(l => l.id);

        function onMouseMove(e) {
            const fuzz = 8;
            const bbox = [
                [e.point.x - fuzz, e.point.y - fuzz],
                [e.point.x + fuzz, e.point.y + fuzz]
            ];
            // Query all hoverable layers at once
            const features = map.queryRenderedFeatures(bbox, { layers: hoverLayers });

            if (features.length > 0) {
                // Find the feature closest to the mouse pointer
                let minDist = Infinity;
                let closestFeature = null;
                let closestLayer = null;
                for (const feature of features) {
                    const coords = feature.geometry.coordinates;
                    // Project feature coordinates to screen point
                    const screen = map.project(Array.isArray(coords[0]) ? coords[0] : coords);
                    const dx = e.point.x - screen.x;
                    const dy = e.point.y - screen.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        closestFeature = feature;
                    }
                }
                // Find the corresponding layer definition
                closestLayer = layers.find(l => l.id === closestFeature.layer.id);

                // Only update popup if feature changed or moved
                if (!popup) {
                    popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "dash-maplibre-popup" });
                }
                let html;
                if (typeof closestLayer.hover_html === "function") {
                    html = closestLayer.hover_html(closestFeature);
                } else if (typeof interpolateTemplate === "function" && closestFeature.properties) {
                    html = interpolateTemplate(closestLayer.hover_html, closestFeature.properties);
                } else {
                    html = closestLayer.hover_html;
                }
                popup
                    .setLngLat(closestFeature.geometry.coordinates)
                    .setHTML(html)
                    .addTo(map);
                map.getCanvas().style.cursor = 'pointer';
            } else {
                // Remove popup if no feature is close
                if (popup) {
                    popup.remove();
                    popup = null;
                }
                map.getCanvas().style.cursor = '';
            }
        }

        // Remove popup when mouse leaves the map
        function onMapMouseLeave() {
            if (popup) {
                popup.remove();
                popup = null;
            }
            map.getCanvas().style.cursor = '';
        }

        map.on('mousemove', onMouseMove);
        map.getCanvas().addEventListener('mouseleave', onMapMouseLeave);

        // Cleanup
        return () => {
            map.off('mousemove', onMouseMove);
            map.getCanvas().removeEventListener('mouseleave', onMapMouseLeave);
            if (popup) {
                popup.remove();
                popup = null;
            }
        };
    }, [layers, sources, styleLoaded]);

    // 6. Camera updates
    useEffect(() => {
        if (!mapRef.current) {return;}

        console.log("Updating camera view");
        const map = mapRef.current;
        if (center && typeof zoom === "number") {
            savedViewRef.current = { center, zoom };
        }
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

    // 7. Layer visibility toggling
    useEffect(() => {
        if (!mapRef.current) {return;}

        console.log("Updating layer visibility");
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
    }, [visibleLayers, layers, styleLoaded]);

    // 8. Sync visibleLayers state with layers prop
    useEffect(() => {
        console.log("Syncing visibleLayers state with layers prop");
        const validIds = layers.filter(l => l.display_name).map(l => l.id);
        setVisibleLayers(vs => {
            if (
                vs.length === validIds.length &&
                vs.every((id, i) => id === validIds[i])
            ) {
                return vs;
            }
            return validIds;
        });
    }, [layers]);

    // 9. Double-click to restore view
    useEffect(() => {
        if (!mapRef.current) {return;}

        console.log("Setting up double-click to restore view");
        const map = mapRef.current;
        map.doubleClickZoom.disable();
        function handleDblClick(_e) {
            if (savedViewRef.current) {
                map.flyTo({
                    center: savedViewRef.current.center,
                    zoom: savedViewRef.current.zoom,
                    bearing: 0,
                    pitch: 0,
                });
            }
        }
        map.on('dblclick', handleDblClick);
        return () => { 
            map.off('dblclick', handleDblClick); 
        };
    }, []);

    // 10. Handle layer clicks
    useEffect(() => {
        if (!mapRef.current) {return;}

        console.log("Setting up layer click handlers");
        const map = mapRef.current;
        const handlers = {};
        const clickableLayerIds = layers.filter(layer => layer.send_click).map(layer => layer.id);

        layers.forEach(layer => {
            if (!layer.send_click) {return;}
            const layerId = layer.id;

            function onLayerClick(e) {
                if (setProps && e.features && e.features.length > 0) {
                    setProps({
                        clickData: {
                            layer: layerId,
                            features: e.features.map(f => ({
                                properties: f.properties
                            }))
                        }
                    });
                }
            }

            handlers[layerId] = onLayerClick;
            if (map.getLayer(layerId)) {
                map.on('click', layerId, onLayerClick);
            }
        });

        // Global fallback click handler (only if no layer was hit)
        function onMapClick(e) {
            const features = map.queryRenderedFeatures(e.point, {
                layers: clickableLayerIds
            });

            if (setProps && (!features || features.length === 0)) {
                setProps({
                    clickData: {
                        layer: null,
                        features: []
                    }
                });
            }
        }
        map.on('click', onMapClick);

        // Cleanup
        return () => {
            layers.forEach(layer => {
                if (!layer.send_click) {return;}
                const layerId = layer.id;
                const handler = handlers[layerId];
                if (handler && mapRef.current && mapRef.current.style && map.getLayer(layerId)) {
                    map.off('click', layerId, handler);
                }
            });
        };
    }, [layers, sources, styleLoaded]);

    // 11. Render legend
    function renderLegend(legendLayers, visibleLayers, setVisibleLayers, version) {
        return (
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                background: "var(--mantine-color-body)",
                padding: 6,
                zIndex: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
                minWidth: 120
            }}>
                {legendLayers.map(layer => {
                    let color =
                        layer.paint?.["circle-color"] ||
                        layer.paint?.["fill-color"] ||
                        layer.paint?.["line-color"] ||
                        "#ccc";
                    if (Array.isArray(color)) { color = "#ccc"; }
                    let swatch = null;
                    if (layer.type === "circle") {
                        swatch = (
                            <span style={{
                                display: "inline-block",
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                marginRight: 13,
                                marginLeft: 3,
                                background: color
                            }} />
                        );
                    } else if (layer.type === "fill") {
                        swatch = (
                            <span style={{
                                display: "inline-block",
                                width: 20,
                                height: 12,
                                marginRight: 10,
                                background: color
                            }} />
                        );
                    } else if (layer.type === "line") {
                        swatch = (
                            <svg width={20} height={16} style={{marginRight: 10, verticalAlign: "middle"}}>
                                <line x1={2} y1={8} x2={18} y2={8} stroke={color} strokeWidth={4}/>
                            </svg>
                        );
                    } else {
                        swatch = (
                            <span style={{
                                display: "inline-block",
                                width: 20,
                                height: 12,
                                marginRight: 10,
                                background: "#ccc",
                                border: "1px solid #999"
                            }} />
                        );
                    }
                    return (
                        <div
                            key={layer.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                fontWeight: "normal",
                                opacity: visibleLayers.includes(layer.id) ? 1 : 0.5,
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
                            {swatch}
                            <span>{layer.display_name}</span>
                        </div>
                    );
                })}
                {version && (
                    <div
                        style={{
                            textAlign: "right",
                            color: "var(--mantine-color-text)",
                            fontSize: "0.6em",
                            userSelect: "none"
                        }}
                    >
                        {version}
                    </div>
                )}
            </div>
        );
    }

    // 12. Patch layer properties
    function patchLayerProperties(map, layer) {
        const mapLayer = map.getLayer(layer.id);
        if (!mapLayer) {return;}

        // PATCH PAINT PROPERTIES
        const paint = layer.paint || {};
        // Set or update paint properties
        Object.entries(paint).forEach(([k, v]) => {
            try {
                if (map.getPaintProperty(layer.id, k) !== v) {
                    map.setPaintProperty(layer.id, k, v);
                }
            } catch (err) {
                console.error(err);
            }
        });

        // PATCH LAYOUT PROPERTIES
        const layout = layer.layout || {};
        Object.entries(layout).forEach(([k, v]) => {
            try {
                if (map.getLayoutProperty(layer.id, k) !== v) {
                    map.setLayoutProperty(layer.id, k, v);
                }
            } catch (err) {
                console.error(err);
            }
        });

        // PATCH FILTER
        if ('filter' in layer) {
            try {
                if (JSON.stringify(map.getFilter(layer.id)) !== JSON.stringify(layer.filter)) {
                    map.setFilter(layer.id, layer.filter);
                }
            } catch (err) {
                console.error(err);
            }
        }

        // PATCH MINZOOM/MAXZOOM
        if ('minzoom' in layer) {
            try {
                if (mapLayer.minzoom !== layer.minzoom) {
                    map.setLayerZoomRange(layer.id, layer.minzoom, mapLayer.maxzoom);
                }
            } catch (err) {
                console.error(err);
            }
        }
        if ('maxzoom' in layer) {
            try {
                if (mapLayer.maxzoom !== layer.maxzoom) {
                    map.setLayerZoomRange(layer.id, mapLayer.minzoom, layer.maxzoom);
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    // 13. Listen for zoom changes on the map
    useEffect(() => {
        if (!mapRef.current) {return;}
        
        console.log("Setting up zoom listener");
        const map = mapRef.current;
        function onZoom() {
            setCurrentZoom(map.getZoom());
        }
        map.on('zoom', onZoom);
        // Set initial zoom
        setCurrentZoom(map.getZoom());
        return () => {
            map.off('zoom', onZoom);
        };
    }, [styleLoaded]);

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                ...style
            }}
            id={id}
        >
            <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: "relative", display: "flex", flexDirection: "column" }}>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 24,
                        width: "100%",
                        maxWidth: "100%",
                        alignItems: "stretch"
                    }}
                >
                    {getColorbarForZoom(colorbar_map, currentZoom) && (
                        <div style={{ flex: "1 1 0", minWidth: 0, padding: "0 8px"}}>
                            <Colorbar {...getColorbarForZoom(colorbar_map, currentZoom)} />
                        </div>
                    )}
                    {colorbar_risk && (
                        <div style={{ flex: "1 1 0", minWidth: 0, padding: "0 8px" }}>
                            <Colorbar {...colorbar_risk} />
                        </div>
                    )}
                </div>
                <div
                    ref={mapContainer}
                    style={{ width: "100%", height: "100%", flex: 1, minHeight: 0, minWidth: 0, position: "relative" }}
                >
                    {legendLayers.length > 0 && renderLegend(legendLayers, visibleLayers, setVisibleLayers, version)}
                </div>
            </div>
        </div>
    );
};

DashMaplibre.propTypes = {

    /**
     * The unique ID of this component.
     */
    id: PropTypes.string,

    /**
     * The basemap style, either as a URL string to a MapLibre style JSON,
     * or as a style JSON object.
     */
    basemap: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),

    /**
     * The map center as a [longitude, latitude] array.
     */
    center: PropTypes.array,

    /**
     * The zoom level of the map.
     */
    zoom: PropTypes.number,

    /**
     * The maximum bounds of the map as [[west, south], [east, north]].
     */
    max_bounds: PropTypes.array,

    /**
     * The bearing (rotation) of the map in degrees.
     */
    bearing: PropTypes.number,

    /**
     * The pitch (tilt) of the map in degrees.
     */
    pitch: PropTypes.number,

    /**
     * The sources definition for MapLibre, as an object mapping source IDs to source definitions.
     */
    sources: PropTypes.object,

    /**
     * The array of MapLibre layer definitions to display on the map.
     */
    layers: PropTypes.array,

    /**
     * Additional CSS styles to apply to the map container.
     */
    style: PropTypes.object,

    /**
     * Configuration for the colorbar legend for the map.
     * Can be a single colorbar config object, or a dictionary where keys are zoom levels
     * (as numbers or strings) and values are colorbar config objects. The colorbar for the
     * highest zoom key less than or equal to the current zoom will be shown.
     */
    colorbar_map: PropTypes.oneOfType([
        PropTypes.object, 
        PropTypes.shape({
            // keys: zoom levels (as string or number), values: colorbar config objects
            // This is a loose check; for stricter validation, use custom PropType
        })
    ]),

    /**
     * Configuration for the colorbar legend for risk visualization.
     */
    colorbar_risk: PropTypes.object,

    /**
     * Dash callback setter for prop updates (provided by Dash).
     */
    setProps: PropTypes.func,

    /**
     * Optional version string to display in the lower right corner of the legend.
     */
    version: PropTypes.string,
    
    /**
     * Feature state to apply to map sources.
     * Structure:
     * {
     *   [sourceId]: {
     *     [sourceLayerId]: {
     *       [stateKey]: {
     *         [featureId]: any
     *       }
     *     }
     *   }
     * }
     */
    feature_state: PropTypes.object,
};

export default DashMaplibre;

