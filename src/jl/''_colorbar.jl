# AUTO GENERATED FILE - DO NOT EDIT

export ''_colorbar

"""
    ''_colorbar(;kwargs...)

A Colorbar component.
Colorbar Component

A component creating a colorbar with the d3 library.
Keyword arguments:
- `barHeight` (Real; optional): Height of the colorbar.
- `labelHeight` (Real; optional): Height of the labels.
- `labels` (Dict; optional): Labels for specific positions on the colorbar.
Keys are positions (0 to 1) and values are label texts.
- `stops` (Dict; required): The stops to infer the colorbar from.
- `title` (String; optional): The title of the colorbar.
- `titleHeight` (Real; optional): Height of the title.
"""
function ''_colorbar(; kwargs...)
        available_props = Symbol[:barHeight, :labelHeight, :labels, :stops, :title, :titleHeight]
        wild_props = Symbol[]
        return Component("''_colorbar", "Colorbar", "dash_maplibre", available_props, wild_props; kwargs...)
end

