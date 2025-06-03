% Auto-generated: do not edit by hand
\name{''DashMaplibre}

\alias{''DashMaplibre}

\title{DashMaplibre component}

\description{
DashMaplibre Component  A component exposing the MapLibre GL JS library for use in Dash applications.
}

\usage{
''DashMaplibre(id=NULL, basemap=NULL, bearing=NULL, center=NULL,
colorbar_map=NULL, colorbar_risk=NULL, hover_html=NULL,
hover_layer=NULL, layers=NULL, max_bounds=NULL, pitch=NULL,
sources=NULL, style=NULL, zoom=NULL)
}

\arguments{
\item{id}{Character. The ID of the component, used to identify it in Dash callbacks.}

\item{basemap}{Character | named list. The basemap URL or json.}

\item{bearing}{Numeric. The bearing of the camera.}

\item{center}{Unnamed list. The center of the camera.}

\item{colorbar_map}{Named list. Colorbar configuration for the map colorbar.}

\item{colorbar_risk}{Named list. Colorbar configuration for the risk colorbar.}

\item{hover_html}{Character. The HTML template for hover popups.
Use {property_name} to interpolate properties from the hovered feature.}

\item{hover_layer}{Character. The layer ID to attach hover events to.}

\item{layers}{Unnamed list. The maplibre layers list.}

\item{max_bounds}{Unnamed list. The maximum bounds of the camera.}

\item{pitch}{Numeric. The pitch of the camera.}

\item{sources}{Named list. The maplibre sources dictionary.}

\item{style}{Named list. Additional style properties for the map container.}

\item{zoom}{Numeric. The zoom level of the camera.}
}

\value{named list of JSON elements corresponding to React.js properties and their values}

