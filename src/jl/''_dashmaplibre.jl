# AUTO GENERATED FILE - DO NOT EDIT

export ''_dashmaplibre

"""
    ''_dashmaplibre(;kwargs...)

A DashMaplibre component.

Keyword arguments:
- `id` (String; optional)
- `basemap` (String | Dict; optional)
- `bearing` (Real; optional)
- `center` (Array; optional)
- `colorbar_map` (Dict; optional)
- `colorbar_risk` (Dict; optional)
- `layers` (Array; optional)
- `max_bounds` (Array; optional)
- `pitch` (Real; optional)
- `sources` (Dict; optional)
- `style` (Dict; optional)
- `zoom` (Real; optional)
"""
function ''_dashmaplibre(; kwargs...)
        available_props = Symbol[:id, :basemap, :bearing, :center, :colorbar_map, :colorbar_risk, :layers, :max_bounds, :pitch, :sources, :style, :zoom]
        wild_props = Symbol[]
        return Component("''_dashmaplibre", "DashMaplibre", "dash_maplibre", available_props, wild_props; kwargs...)
end

