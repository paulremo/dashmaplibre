# AUTO GENERATED FILE - DO NOT EDIT

#' @export
''Colorbar <- function(barHeight=NULL, format=NULL, labelHeight=NULL, labels=NULL, stops=NULL, title=NULL, titleHeight=NULL) {
    
    props <- list(barHeight=barHeight, format=format, labelHeight=labelHeight, labels=labels, stops=stops, title=title, titleHeight=titleHeight)
    if (length(props) > 0) {
        props <- props[!vapply(props, is.null, logical(1))]
    }
    component <- list(
        props = props,
        type = 'Colorbar',
        namespace = 'dash_maplibre',
        propNames = c('barHeight', 'format', 'labelHeight', 'labels', 'stops', 'title', 'titleHeight'),
        package = 'dashMaplibre'
        )

    structure(component, class = c('dash_component', 'list'))
}
