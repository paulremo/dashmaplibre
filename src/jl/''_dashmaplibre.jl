# AUTO GENERATED FILE - DO NOT EDIT

export ''_dashmaplibre

"""
    ''_dashmaplibre(;kwargs...)

A DashMaplibre component.

Keyword arguments:
- `id` (String; optional)
- `bearing` (Real; optional)
- `center` (Array; optional)
- `colorbar_map` (Dict; optional)
- `colorbar_risk` (Dict; optional)
- `layers` (Array; optional)
- `pitch` (Real; optional)
- `sources` (Dict; optional)
- `style` (Dict; optional)
- `styleUrl` (String; optional)
- `zoom` (Real; optional)
"""
function ''_dashmaplibre(; kwargs...)
        available_props = Symbol[:id, :bearing, :center, :colorbar_map, :colorbar_risk, :layers, :pitch, :sources, :style, :styleUrl, :zoom]
        wild_props = Symbol[]
        return Component("''_dashmaplibre", "DashMaplibre", "dash_maplibre", available_props, wild_props; kwargs...)
end

