import dash
from dash import html, dcc, Output, Input, Patch, ctx, State
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
        style={"margin-bottom": "1em"}
    ),
    html.Button("Change Circle Color", id="color-btn", n_clicks=0, style={"margin-bottom": "1em"}),
    html.Button("Add Second Point Layer", id="add-layer-btn", n_clicks=0, style={"margin-bottom": "1em", "margin-left": "1em"}),
    DashMaplibre(
        id="my-map",
        center=[13.404954, 52.520008],
        # max_bounds=[[2.0, 48.0], [15.0, 55.0]],
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
        colorbar_map={
            "stops": {0: ["#00f", "#66f"], 50: ["#6f6", "#ef0"], 100: ["#f00", "#f88"]},
            "title": "Map info",
            "labels": {"0": "Low", "1": "High", "0.5": "Medium"}
        },
        colorbar_risk={
            "stops": {0: ["#fff", "#ccc"], 1: ["#000", "#333"]},
            "title": "Risk",
            "labels": {"0": "Poor", "1": "Excellent"}
        },
        style={"width": "800px", "height": "500px"}
    )
])

# Update coordinates (PATCH for sources)
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
    # Always handle radio button (move point)
    if triggered == "point-radio":
        sources_patch["my-points"]["data"]["features"][0]["geometry"]["coordinates"] = coords[selected_point]
        sources_patch["my-points"]["data"]["features"][0]["properties"]["name"] = names[selected_point]
    # Always handle color button
    if triggered == "color-btn":
        color = colors[(n_color or 0) % len(colors)]
        layers_patch[0]["paint"]["circle-color"] = color
    # Always handle add layer button
    if triggered == "add-layer-btn":
        # Add source if missing
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
        # Add layer if missing
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

if __name__ == '__main__':
    app.run(debug=True)
