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


Keyword arguments:

- id (string; optional)

- basemap (string | dict; default {  version: 8,  name: "Empty",  sources: {},  layers: []})

- bearing (number; default 0)

- center (list; default [0, 0])

- colorbar_map (dict; optional)

- colorbar_risk (dict; optional)

- layers (list; optional)

- max_bounds (list; optional)

- pitch (number; default 0)

- sources (dict; optional)

- zoom (number; default 2)"""
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
        **kwargs
    ):
        self._prop_names = ['id', 'basemap', 'bearing', 'center', 'colorbar_map', 'colorbar_risk', 'layers', 'max_bounds', 'pitch', 'sources', 'style', 'zoom']
        self._valid_wildcard_attributes =            []
        self.available_properties = ['id', 'basemap', 'bearing', 'center', 'colorbar_map', 'colorbar_risk', 'layers', 'max_bounds', 'pitch', 'sources', 'style', 'zoom']
        self.available_wildcard_properties =            []
        _explicit_args = kwargs.pop('_explicit_args')
        _locals = locals()
        _locals.update(kwargs)  # For wildcard attrs and excess named props
        args = {k: _locals[k] for k in _explicit_args}

        super(DashMaplibre, self).__init__(**args)

setattr(DashMaplibre, "__init__", _explicitize_args(DashMaplibre.__init__))
