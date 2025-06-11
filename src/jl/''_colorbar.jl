# AUTO GENERATED FILE - DO NOT EDIT

export ''_colorbar

"""
    ''_colorbar(;kwargs...)

A Colorbar component.
Colorbar Component

A component creating a colorbar with the d3 library.
It accepts a set of stops defining the color gradient, 
a title, and optional labels for specific positions.
It automatically adjusts to the width of its container
and uses a ResizeObserver to handle responsive resizing.
It also supports formatting of labels using d3-format
or native JavaScript formatting.

Dependencies:
- d3: For creating the SVG elements and handling the color gradient.
- Mantine: For styling and layout.
Keyword arguments:
- `barHeight` (Real; optional): Height of the colorbar.
- `format` (String; optional): Optional format function for labels.
If provided, it will be used to format the label text.
- `labelHeight` (Real; optional): Height of the labels.
- `labels` (Dict; optional): Labels for specific positions on the colorbar.
Keys are positions (0 to 1) and values are label texts.
- `stops` (Dict; required): The stops to infer the colorbar from.
- `title` (String; optional): The title of the colorbar.
- `titleHeight` (Real; optional): Height of the title.
"""
function ''_colorbar(; kwargs...)
        available_props = Symbol[:barHeight, :format, :labelHeight, :labels, :stops, :title, :titleHeight]
        wild_props = Symbol[]
        return Component("''_colorbar", "Colorbar", "dash_maplibre", available_props, wild_props; kwargs...)
end

