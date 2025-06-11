# AUTO GENERATED FILE - DO NOT EDIT

export ''_dashmaplibre

"""
    ''_dashmaplibre(;kwargs...)

A DashMaplibre component.
DashMaplibre is a React component for displaying interactive maps using MapLibre GL JS.
It supports custom basemaps, layers, sources, and interactive features like hover popups and click events.
It is designed to be used within a Dash application, allowing for dynamic updates and interactivity.

Dependencies:
- maplibre-gl: For rendering maps and handling layers/sources.
- Colorbar: A custom component for displaying colorbars alongside the map.
- Mantine for styling and layout.
Keyword arguments:
- `id` (String; optional): The unique ID of this component.
- `basemap` (String | Dict; optional): The basemap style, either as a URL string to a MapLibre style JSON,
or as a style JSON object.
- `bearing` (Real; optional): The bearing (rotation) of the map in degrees.
- `center` (Array; optional): The map center as a [longitude, latitude] array.
- `colorbar_map` (Dict; optional): Configuration for the colorbar legend for the map.
- `colorbar_risk` (Dict; optional): Configuration for the colorbar legend for risk visualization.
- `layers` (Array; optional): The array of MapLibre layer definitions to display on the map.
- `max_bounds` (Array; optional): The maximum bounds of the map as [[west, south], [east, north]].
- `pitch` (Real; optional): The pitch (tilt) of the map in degrees.
- `sources` (Dict; optional): The sources definition for MapLibre, as an object mapping source IDs to source definitions.
- `style` (Dict; optional): Additional CSS styles to apply to the map container.
- `zoom` (Real; optional): The zoom level of the map.
"""
function ''_dashmaplibre(; kwargs...)
        available_props = Symbol[:id, :basemap, :bearing, :center, :colorbar_map, :colorbar_risk, :layers, :max_bounds, :pitch, :sources, :style, :zoom]
        wild_props = Symbol[]
        return Component("''_dashmaplibre", "DashMaplibre", "dash_maplibre", available_props, wild_props; kwargs...)
end

