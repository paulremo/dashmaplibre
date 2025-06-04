% Auto-generated: do not edit by hand
\name{''Colorbar}

\alias{''Colorbar}

\title{Colorbar component}

\description{
Colorbar Component  A component creating a colorbar with the d3 library.
}

\usage{
''Colorbar(barHeight=NULL, format=NULL, labelHeight=NULL, labels=NULL,
stops=NULL, title=NULL, titleHeight=NULL)
}

\arguments{
\item{barHeight}{Numeric. Height of the colorbar.}

\item{format}{Character. Optional format function for labels.
If provided, it will be used to format the label text.}

\item{labelHeight}{Numeric. Height of the labels.}

\item{labels}{Named list. Labels for specific positions on the colorbar.
Keys are positions (0 to 1) and values are label texts.}

\item{stops}{Named list. The stops to infer the colorbar from.}

\item{title}{Character. The title of the colorbar.}

\item{titleHeight}{Numeric. Height of the title.}
}

\value{named list of JSON elements corresponding to React.js properties and their values}

