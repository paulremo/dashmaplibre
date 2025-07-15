import dash
from dash import html, dcc, Output, Input, State, Patch, ctx
from dash.exceptions import PreventUpdate
from dash_maplibre import DashMaplibre
import dash_mantine_components as dmc
import requests

app = dash.Dash(__name__)
dash._dash_renderer._set_react_version("18.2.0")

def get_basemap(scheme):
    """Loads the basemap from the Carto server and modifies it, returning a Maplibre mapstyle object."""
    if scheme == "light":
        basemap = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    else:
        basemap = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    response = requests.get(basemap)

    return response.json()

# The initial GeoJSON with a single point
base_geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [13.404954, 52.520008]},
            "properties": {"name": "City", "risk": 123, "prob": 0.424124321, "volume": 1231, "zweck_coarse": 4, "stoerfall_str": "Ja"}
        }
    ]
}

coords = {
    "point1": [13.404954, 52.520008],   # Berlin
    "point2": [2.352222, 48.856613]     # Paris
}
names = {
    "point1": "Berlin",
    "point2": "Paris"
}

# Circle colors to cycle through
colors = ["#007cbf", "#e63946", "#2a9d8f", "#ffb703"]

# Store your initial sources and layers as variables
initial_sources = {
    "my-points": {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [13.404954, 52.520008]},
                    "properties": {"name": "Berlin"}
                }
            ]
        }
    }
}
initial_layers = [
    {
        "id": "points",
        "display_name": "Point layer",
        "type": "circle",
        "source": "my-points",
        "paint": {
            "circle-radius": 8,
            "circle-color": "#007cbf"
        }
    }
]
initial_basemap = "https://demotiles.maplibre.org/style.json"

app.layout = dmc.MantineProvider(html.Div([
    html.Button("Initialize Map", id="init-btn", n_clicks=0, style={"marginBottom": "1em"}),
    dcc.RadioItems(
        id="point-radio",
        options=[
            {"label": "Point 1 (Berlin)", "value": "point1"},
            {"label": "Point 2 (Paris)", "value": "point2"}
        ],
        value="point1",
        inline=True,
        style={"marginBottom": "1em"}
    ),
    html.Button("Change Circle Color", id="color-btn", n_clicks=0, style={"marginBottom": "1em"}),
    html.Button("Add Second Point Layer", id="add-layer-btn", n_clicks=0, style={"marginBottom": "1em", "marginLeft": "1em"}),
    html.Button("Set Center & Zoom", id="center-zoom-btn", n_clicks=0, style={"marginBottom": "1em", "marginLeft": "1em"}),
    html.Button("Toggle basemap", id="toggle-basemap-btn", n_clicks=0, style={"marginBottom": "1em", "marginLeft": "1em"}),
    DashMaplibre(
        id="my-map",
        zoom=8,
        colorbar_map={0: {
            "stops": {0: ["#00f", "#66f"], 50: ["#6f6", "#ef0"], 100: ["#f00", "#f88"]},
            "title": "Map info",
            "format": ".4e"
        }, 10: {
            "stops": {0: ["#00f", "#66f"], 50: ["#6f6", "#ef0"], 100: ["#f00", "#f88"]},
            "title": "Zoom Map info",
            "labels": {"0": "Zoom Low", "1": "Zoom High", "0.5": "Zoom Medium"}
        }
        },
        colorbar_risk={
            "stops": {0: ["#fff", "#ccc"], 1: ["#000", "#333"]},
            "title": "Risk",
            "format": "1/_val.2f",
        },
        style={"width": "800px", "height": "500px"},
        version="my-test-version"
    )
]), id="main-provider", forceColorScheme="dark")

# Toggle colorscheme callback
@app.callback(
    Output("my-map", "basemap", allow_duplicate=True),
    Input("toggle-basemap-btn", "n_clicks"),
    State("my-map", "basemap"),
    prevent_initial_call=True
)
def toggle_scheme(n_clicks, current_scheme):
    if n_clicks is None:
        raise PreventUpdate
    if n_clicks % 2 == 0:
        return get_basemap("light")
    else:
        return get_basemap("dark")
    

# Update coordinates, color, and add layer
@app.callback(
    Output("my-map", "sources"),
    Output("my-map", "layers"),
    Output("my-map", "basemap"),
    Output("my-map", "center"),
    Input("init-btn", "n_clicks"),
    Input("color-btn", "n_clicks"),
    Input("add-layer-btn", "n_clicks"),
    Input("point-radio", "value"),
    State("my-map", "sources"),
    State("my-map", "layers"),
    State("my-map", "basemap"),
    prevent_initial_call=True
)
def update_map(n_init, n_color, n_add_layer, selected_point, current_sources, current_layers, current_basemap):
    triggered = ctx.triggered_id
    sources_patch = Patch()
    layers_patch = Patch()

    if triggered == "init-btn":
        return initial_sources, initial_layers, initial_basemap, [13.404954, 52.520008]


    # Move point
    if triggered == "point-radio":
        sources_patch["my-points"]["data"]["features"][0]["geometry"]["coordinates"] = coords[selected_point]
        sources_patch["my-points"]["data"]["features"][0]["properties"]["name"] = names[selected_point]
    # Change color
    if triggered == "color-btn":
        color = colors[(n_color or 0) % len(colors)]
        layers_patch[0]["paint"]["circle-color"] = color
    # Add second point layer
    if triggered == "add-layer-btn":
        if "my-points-2" not in (current_sources or {}):
            sources_patch["my-points-2"] = {
                "type": "geojson",
                "data": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {"type": "Point", "coordinates": [10.0, 51.0]},
                            "properties": {"name": "New Point", "risk": 42, "prob": 0.99, "volume": 100, "zweck_coarse": 1, "stoerfall_str": "Nein"}
                        }
                    ]
                }
            }
        ids = [l.get("id") for l in (current_layers or [])]
        if "points-2" not in ids:
            layers_patch[len(current_layers or [])] = {
                "id": "points-2",
                "display_name": "Second Point",
                "type": "circle",
                "source": "my-points-2",
                "paint": {
                    "circle-radius": 10,
                    "circle-color": "#e63946",
                    "circle-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0, 15, 0.6],
                },
                "minzoom": 4,
                "hover_html": (
                    "<strong>{name}</strong><br/>"
                    "Risiko: {risk}<br/>"
                    "Wahrscheinlichkeit: {prob:.0f}<br/>"
                    "Volumen: {volume:.0e}<br/>"
                    "Zweck: {zweck_coarse}<br/>"
                    "Störfall: {stoerfall_str}"
                ),
            }
    return sources_patch, layers_patch, current_basemap, dash.no_update

# Set center and zoom via button
@app.callback(
    Output("my-map", "center", allow_duplicate=True),
    Output("my-map", "zoom"),
    Input("center-zoom-btn", "n_clicks"),
    prevent_initial_call=True
)
def set_center_zoom(n_clicks):
    # Example: set to Paris at zoom 8
    return [2.352222, 48.856613], 8

if __name__ == '__main__':
    app.run(debug=True)
