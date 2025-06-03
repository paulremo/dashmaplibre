# AUTO GENERATED FILE - DO NOT EDIT

#' @export
''DashMaplibre <- function(id=NULL, basemap=NULL, bearing=NULL, center=NULL, colorbar_map=NULL, colorbar_risk=NULL, hover_html=NULL, hover_layer=NULL, layers=NULL, pitch=NULL, sources=NULL, style=NULL, zoom=NULL) {
    
    props <- list(id=id, basemap=basemap, bearing=bearing, center=center, colorbar_map=colorbar_map, colorbar_risk=colorbar_risk, hover_html=hover_html, hover_layer=hover_layer, layers=layers, pitch=pitch, sources=sources, style=style, zoom=zoom)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'DashMaplibre',
        namespace = 'dash_maplibre',
        propNames = c('id', 'basemap', 'bearing', 'center', 'colorbar_map', 'colorbar_risk', 'hover_html', 'hover_layer', 'layers', 'pitch', 'sources', 'style', 'zoom'),
        package = 'dashMaplibre'
        )

    structure(component, class = c('dash_component', 'list'))
}
