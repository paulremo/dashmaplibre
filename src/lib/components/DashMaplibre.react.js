/* eslint-disable consistent-return */
import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import Colorbar from './Colorbar.react.js';

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

const DashMaplibre = ({
    id,
    basemap = EMPTY_BASEMAP,
    center = [0, 0],
    zoom = 2,
    max_bounds = null,
    bearing = 0,
    pitch = 0,
    sources = {},
    layers = [],
    style = {},
    colorbar_map = null,
    colorbar_risk = null,
    setProps,
    ...otherProps
}) => {
    const mapContainer = useRef(null);
    const mapRef = useRef(null);
    const prevLayersRef = useRef([]);
    const [visibleLayers, setVisibleLayers] = useState(() => layers.filter(l => l.display_name).map(l => l.id));
    const [styleLoaded, setStyleLoaded] = useState(false);
    const savedViewRef = useRef({ center, zoom });
    const legendLayers = layers.filter(l => l.display_name);

    // 1. Initialize map only once
    useEffect(() => {
        console.debug("[DashMaplibre] useEffect: map init");
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
            console.debug("[DashMaplibre] useEffect cleanup: map init");
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // 2. Handle basemap (style) changes
    useEffect(() => {
        console.debug("[DashMaplibre] useEffect: basemap change", basemap);
        if (!mapRef.current) {return;}
        const map = mapRef.current;
        setStyleLoaded(false);
        console.debug("[DashMaplibre] Style loaded false");
        prevLayersRef.current = [];

        function onIdle() {
            setStyleLoaded(true);
            console.debug("[DashMaplibre] Style loaded true");
            map.off('idle', onIdle);
        }
        map.on('idle', onIdle);
        map.setStyle(basemap);

        return () => {
            console.debug("[DashMaplibre] useEffect cleanup: basemap change");
            map.off('idle', onIdle);
        };
    }, [basemap]);

    // 3. Add/update sources after style is loaded
    useEffect(() => {
        console.debug("[DashMaplibre] useEffect: sources update", sources, styleLoaded);
        if (!mapRef.current || !styleLoaded) {return;}
        const map = mapRef.current;
        Object.entries(sources).forEach(([id, src]) => {
            if (!map.getSource(id)) {
                console.debug("[DashMaplibre] Adding source:", id, src);
                try { map.addSource(id, src); } catch (err) {}
            } else if (src.type === "geojson") {
                console.debug("[DashMaplibre] Updating source data:", id, src.data);
                map.getSource(id).setData(src.data);
            }
        });
    }, [sources, styleLoaded]);

    // 4. Add/remove/update app layers after style and sources are ready
    useEffect(() => {
        console.debug("[DashMaplibre] useEffect: app layers update", layers, sources, styleLoaded);
        if (!mapRef.current || !styleLoaded) {return;}
        const map = mapRef.current;

        // Remove app layers whose source is missing or which are no longer in the layers prop
        prevLayersRef.current.forEach(layer => {
            const sourceExists = Boolean(map.getSource(layer.source));
            const stillInLayers = layers.some(l => l.id === layer.id);
            if ((!sourceExists || !stillInLayers) && map.getLayer(layer.id)) {
                console.debug("[DashMaplibre] Removing app layer:", layer.id);
                map.removeLayer(layer.id);
            }
        });

        // Add app layers whose source exists and which are not already on the map
        layers.forEach((layer, idx) => {
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
                console.debug("[DashMaplibre] Adding app layer:", layer.id, "before", beforeId);
                try { map.addLayer(layer, beforeId); } catch (err) { console.warn("addLayer failed", layer.id, err); }
            }
            // Patch properties for all existing layers
            patchLayerProperties(map, layer);
        });

        // Update prevLayersRef to only track app layers
        prevLayersRef.current = layers.slice();
    }, [layers, sources, styleLoaded]);

    // 5. Hover popups for layers with hover_html
    useEffect(() => {
        console.debug("[DashMaplibre] useEffect: hover popups", layers, sources, styleLoaded);
        if (!mapRef.current) {return;}
        const map = mapRef.current;
        const popups = {};
        const handlers = {};

        layers.forEach(layer => {
            if (!layer.hover_html) {return;}
            const layerId = layer.id;
            const hoverHtml = layer.hover_html;

            function onMouseEnter(e) {
                const feature = e.features[0];
                map.getCanvas().style.cursor = 'pointer';
                const props = feature.properties;
                const html = interpolateTemplate(hoverHtml, props);
                if (!popups[layerId]) {
                    popups[layerId] = new maplibregl.Popup({ closeButton: false, closeOnClick: false});
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
            if (map.getLayer(layerId)) {
                map.on('mouseenter', layerId, onMouseEnter);
                map.on('mouseleave', layerId, onMouseLeave);
            }
        });

        // Cleanup
        return () => {
            console.debug("[DashMaplibre] useEffect cleanup: hover popups");
            layers.forEach(layer => {
                if (!layer.hover_html) {return;}
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
    }, [layers, sources, styleLoaded]);

    // 6. Camera updates
    useEffect(() => {
        console.debug("[DashMaplibre] useEffect: camera update", center, zoom, bearing, pitch);
        if (!mapRef.current) {return;}
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
        console.debug("[DashMaplibre] useEffect: layer visibility", visibleLayers, layers, styleLoaded);
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
    }, [visibleLayers, layers, styleLoaded]);

    // 8. Sync visibleLayers state with layers prop
    useEffect(() => {
        console.debug("[DashMaplibre] useEffect: sync visibleLayers", layers);
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
        console.debug("[DashMaplibre] useEffect: double-click restore view");
        if (!mapRef.current) {return;}
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
            console.debug("[DashMaplibre] useEffect cleanup: double-click restore view");
            map.off('dblclick', handleDblClick); 
        };
    }, []);

    // 10. Handle layer clicks
    useEffect(() => {
        if (!mapRef.current) {return;}
        const map = mapRef.current;
        const handlers = {};

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

        // Cleanup
        return () => {
            layers.forEach(layer => {
                if (!layer.send_click) {return;}
                const layerId = layer.id;
                const handler = handlers[layerId];
                if (handler && map.getLayer(layerId)) {
                    map.off('click', layerId, handler);
                }
            });
        };
    }, [layers, sources, styleLoaded]);

    // 11. Render legend
    function renderLegend(legendLayers, visibleLayers, setVisibleLayers) {
        return (
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                background: "#fff",
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
            } catch (err) {}
        });

        // PATCH LAYOUT PROPERTIES
        const layout = layer.layout || {};
        Object.entries(layout).forEach(([k, v]) => {
            try {
                if (map.getLayoutProperty(layer.id, k) !== v) {
                    map.setLayoutProperty(layer.id, k, v);
                }
            } catch (err) {}
        });

        // PATCH FILTER
        if ('filter' in layer) {
            try {
                if (JSON.stringify(map.getFilter(layer.id)) !== JSON.stringify(layer.filter)) {
                    map.setFilter(layer.id, layer.filter);
                }
            } catch (err) {}
        }

        // PATCH MINZOOM/MAXZOOM
        if ('minzoom' in layer) {
            try {
                if (mapLayer.minzoom !== layer.minzoom) {
                    map.setLayerZoomRange(layer.id, layer.minzoom, mapLayer.maxzoom);
                }
            } catch (err) {}
        }
        if ('maxzoom' in layer) {
            try {
                if (mapLayer.maxzoom !== layer.maxzoom) {
                    map.setLayerZoomRange(layer.id, mapLayer.minzoom, layer.maxzoom);
                }
            } catch (err) {}
        }
    }

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
                    {colorbar_map && (
                        <div style={{ flex: "1 1 0", minWidth: 0, padding: "0 8px"}}>
                            <Colorbar {...colorbar_map} />
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
                    {legendLayers.length > 0 && renderLegend(legendLayers, visibleLayers, setVisibleLayers)}
                </div>
            </div>
        </div>
    );
};

DashMaplibre.propTypes = {
    id: PropTypes.string,
    basemap: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    center: PropTypes.array,
    zoom: PropTypes.number,
    max_bounds: PropTypes.array,
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

