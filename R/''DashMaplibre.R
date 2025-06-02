# AUTO GENERATED FILE - DO NOT EDIT

#' @export
''DashMaplibre <- function(id=NULL, bearing=NULL, center=NULL, colorbar_map=NULL, colorbar_risk=NULL, layers=NULL, pitch=NULL, sources=NULL, style=NULL, styleUrl=NULL, zoom=NULL) {
    
    props <- list(id=id, bearing=bearing, center=center, colorbar_map=colorbar_map, colorbar_risk=colorbar_risk, layers=layers, pitch=pitch, sources=sources, style=style, styleUrl=styleUrl, zoom=zoom)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'DashMaplibre',
        namespace = 'dash_maplibre',
        propNames = c('id', 'bearing', 'center', 'colorbar_map', 'colorbar_risk', 'layers', 'pitch', 'sources', 'style', 'styleUrl', 'zoom'),
        package = 'dashMaplibre'
        )

    structure(component, class = c('dash_component', 'list'))
}
