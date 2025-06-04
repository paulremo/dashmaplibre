import dash
from dash import html, dcc, Output, Input, State, Patch, ctx
from dash_maplibre import DashMaplibre

app = dash.Dash(__name__)

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

app.layout = html.Div([
    html.H1("Dash MapLibre Demo"),
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
    DashMaplibre(
        id="my-map",
        center=[13.404954, 52.520008],
        basemap="https://demotiles.maplibre.org/style.json",
        zoom=5,
        sources={
            "my-points": {
                "type": "geojson",
                "data": base_geojson
            }
        },
        layers=[
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
        ],
        style={"width": "800px", "height": "500px"}
    )
])

# Update coordinates, color, and add layer
@app.callback(
    Output("my-map", "sources"),
    Output("my-map", "layers"),
    Input("color-btn", "n_clicks"),
    Input("add-layer-btn", "n_clicks"),
    Input("point-radio", "value"),
    State("my-map", "sources"),
    State("my-map", "layers"),
    prevent_initial_call=True
)
def update_map(n_color, n_add_layer, selected_point, current_sources, current_layers):
    triggered = ctx.triggered_id
    sources_patch = Patch()
    layers_patch = Patch()
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
                    "circle-color": "#e63946"
                },
                "hover_html": (
                    "<strong>{name}</strong><br/>"
                    "Risiko: {risk}<br/>"
                    "Wahrscheinlichkeit: {prob:.0f}<br/>"
                    "Volumen: {volume:.0e}<br/>"
                    "Zweck: {zweck_coarse}<br/>"
                    "Störfall: {stoerfall_str}"
                ),
            }
    return sources_patch, layers_patch

# Set center and zoom via button
@app.callback(
    Output("my-map", "center"),
    Output("my-map", "zoom"),
    Input("center-zoom-btn", "n_clicks"),
    prevent_initial_call=True
)
def set_center_zoom(n_clicks):
    # Example: set to Paris at zoom 8
    return [2.352222, 48.856613], 8

if __name__ == '__main__':
    app.run(debug=True)
