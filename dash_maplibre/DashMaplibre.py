# AUTO GENERATED FILE - DO NOT EDIT

import typing  # noqa: F401
from typing_extensions import TypedDict, NotRequired, Literal # noqa: F401
from dash.development.base_component import Component, _explicitize_args

ComponentType = typing.Union[
    str,
    int,
    float,
    Component,
    None,
    typing.Sequence[typing.Union[str, int, float, Component, None]],
]

NumberType = typing.Union[
    typing.SupportsFloat, typing.SupportsInt, typing.SupportsComplex
]


class DashMaplibre(Component):
    """A DashMaplibre component.
DashMaplibre Component

A component exposing the MapLibre GL JS library for use in Dash applications.

Keyword arguments:

- id (string; optional):
    The ID of the component, used to identify it in Dash callbacks.

- basemap (string | dict; default {  version: 8,  sources: {},  layers: []}):
    The basemap URL or json.

- bearing (number; default 0):
    The bearing of the camera.

- center (list; default [0, 0]):
    The center of the camera.

- colorbar_map (dict; optional):
    Colorbar configuration for the map colorbar.

- colorbar_risk (dict; optional):
    Colorbar configuration for the risk colorbar.

- hover_html (string; default ""):
    The HTML template for hover popups.  Use {property_name} to
    interpolate properties from the hovered feature.

- hover_layer (string; default ""):
    The layer ID to attach hover events to.

- layers (list; optional):
    The maplibre layers list.

- max_bounds (list; optional):
    The maximum bounds of the camera.

- pitch (number; default 0):
    The pitch of the camera.

- sources (dict; optional):
    The maplibre sources dictionary.

- zoom (number; default 2):
    The zoom level of the camera."""
    _children_props = []
    _base_nodes = ['children']
    _namespace = 'dash_maplibre'
    _type = 'DashMaplibre'


    def __init__(
        self,
        id: typing.Optional[typing.Union[str, dict]] = None,
        basemap: typing.Optional[typing.Union[str, dict]] = None,
        center: typing.Optional[typing.Sequence] = None,
        zoom: typing.Optional[NumberType] = None,
        max_bounds: typing.Optional[typing.Sequence] = None,
        bearing: typing.Optional[NumberType] = None,
        pitch: typing.Optional[NumberType] = None,
        sources: typing.Optional[dict] = None,
        layers: typing.Optional[typing.Sequence] = None,
        style: typing.Optional[typing.Any] = None,
        colorbar_map: typing.Optional[dict] = None,
        colorbar_risk: typing.Optional[dict] = None,
        hover_layer: typing.Optional[str] = None,
        hover_html: typing.Optional[str] = None,
        **kwargs
    ):
        self._prop_names = ['id', 'basemap', 'bearing', 'center', 'colorbar_map', 'colorbar_risk', 'hover_html', 'hover_layer', 'layers', 'max_bounds', 'pitch', 'sources', 'style', 'zoom']
        self._valid_wildcard_attributes =            []
        self.available_properties = ['id', 'basemap', 'bearing', 'center', 'colorbar_map', 'colorbar_risk', 'hover_html', 'hover_layer', 'layers', 'max_bounds', 'pitch', 'sources', 'style', 'zoom']
        self.available_wildcard_properties =            []
        _explicit_args = kwargs.pop('_explicit_args')
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs and excess named props
        args = {k: _locals[k] for k in _explicit_args}

        super(DashMaplibre, self).__init__(**args)

setattr(DashMaplibre, "__init__", _explicitize_args(DashMaplibre.__init__))
