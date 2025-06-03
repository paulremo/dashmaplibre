# AUTO GENERATED FILE - DO NOT EDIT

export ''_dashmaplibre

"""
    ''_dashmaplibre(;kwargs...)

A DashMaplibre component.
DashMaplibre Component

A component exposing the MapLibre GL JS library for use in Dash applications.
Keyword arguments:
- `id` (String; optional): The ID of the component, used to identify it in Dash callbacks.
- `basemap` (String | Dict; optional): The basemap URL or json.
- `bearing` (Real; optional): The bearing of the camera.
- `center` (Array; optional): The center of the camera.
- `colorbar_map` (Dict; optional): Colorbar configuration for the map colorbar.
- `colorbar_risk` (Dict; optional): Colorbar configuration for the risk colorbar.
- `hover_html` (String; optional): The HTML template for hover popups.
Use {property_name} to interpolate properties from the hovered feature.
- `hover_layer` (String; optional): The layer ID to attach hover events to.
- `layers` (Array; optional): The maplibre layers list.
- `pitch` (Real; optional): The pitch of the camera.
- `sources` (Dict; optional): The maplibre sources dictionary.
- `style` (Dict; optional): Additional style properties for the map container.
- `zoom` (Real; optional): The zoom level of the camera.
"""
function ''_dashmaplibre(; kwargs...)
        available_props = Symbol[:id, :basemap, :bearing, :center, :colorbar_map, :colorbar_risk, :hover_html, :hover_layer, :layers, :pitch, :sources, :style, :zoom]
        wild_props = Symbol[]
        return Component("''_dashmaplibre", "DashMaplibre", "dash_maplibre", available_props, wild_props; kwargs...)
end

