import dash
from dash import html, dcc, Output, Input, Patch, ctx
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
    DashMaplibre(
        id="my-map",
        center=[13.404954, 52.520008],
        max_bounds=[[2.0, 48.0], [15.0, 55.0]],
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
        hover_layer="points",
        hover_html=(
            "<strong>{name}</strong><br/>"
            "Risiko: {risk}<br/>"
            "Wahrscheinlichkeit: {prob:.0f}<br/>"
            "Volumen: {volume:.0e}<br/>"
            "Zweck: {zweck_coarse}<br/>"
            "Störfall: {stoerfall_str}"
        ),
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
    Input("point-radio", "value"),
)
def patch_point_coordinates(selected_point):
    patch = Patch()
    patch["my-points"]["data"]["features"][0]["geometry"]["coordinates"] = coords[selected_point]
    patch["my-points"]["data"]["features"][0]["properties"]["name"] = names[selected_point]
    return patch

# Update circle color (PATCH for layers)
@app.callback(
    Output("my-map", "layers"),
    Input("color-btn", "n_clicks"),
)
def patch_circle_color(n_clicks):
    # Cycles through the colors list
    color = colors[n_clicks % len(colors)]
    patch = Patch()
    # 'points' is the id of the layer, 'paint' -> 'circle-color'
    patch[0]["paint"]["circle-color"] = color  # Assumes the points layer is always the first
    return patch

if __name__ == '__main__':
    app.run(debug=True)
