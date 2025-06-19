% Auto-generated: do not edit by hand
\name{''DashMaplibre}

\alias{''DashMaplibre}

\title{DashMaplibre component}

\description{
DashMaplibre is a React component for displaying interactive maps using MapLibre GL JS. It supports custom basemaps, layers, sources, and interactive features like hover popups and click events. It is designed to be used within a Dash application, allowing for dynamic updates and interactivity.  Dependencies: - maplibre-gl: For rendering maps and handling layers/sources. - Colorbar: A custom component for displaying colorbars alongside the map. - Mantine for styling and layout.
}

\usage{
''DashMaplibre(id=NULL, basemap=NULL, bearing=NULL, center=NULL,
colorbar_map=NULL, colorbar_risk=NULL, layers=NULL,
max_bounds=NULL, pitch=NULL, sources=NULL, style=NULL,
version=NULL, zoom=NULL)
}

\arguments{
\item{id}{Character. The unique ID of this component.}

\item{basemap}{Character | named list. The basemap style, either as a URL string to a MapLibre style JSON,
or as a style JSON object.}

\item{bearing}{Numeric. The bearing (rotation) of the map in degrees.}

\item{center}{Unnamed list. The map center as a [longitude, latitude] array.}

\item{colorbar_map}{Named list | lists containing elements .
those elements have the following types:
. Configuration for the colorbar legend for the map.
Can be a single colorbar config object, or a dictionary where keys are zoom levels
(as numbers or strings) and values are colorbar config objects. The colorbar for the
highest zoom key less than or equal to the current zoom will be shown.}

\item{colorbar_risk}{Named list. Configuration for the colorbar legend for risk visualization.}

\item{layers}{Unnamed list. The array of MapLibre layer definitions to display on the map.}

\item{max_bounds}{Unnamed list. The maximum bounds of the map as [[west, south], [east, north]].}

\item{pitch}{Numeric. The pitch (tilt) of the map in degrees.}

\item{sources}{Named list. The sources definition for MapLibre, as an object mapping source IDs to source definitions.}

\item{style}{Named list. Additional CSS styles to apply to the map container.}

\item{version}{Character. Optional version string to display in the lower right corner of the legend.}

\item{zoom}{Numeric. The zoom level of the map.}
}

\value{named list of JSON elements corresponding to React.js properties and their values}

