import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import * as d3 from "d3";

const DEFAULT_BAR_HEIGHT = 24;
const DEFAULT_TITLE_HEIGHT = 24;
const DEFAULT_LABEL_HEIGHT = 24;
const LABEL_ALIGN_BUFFER = 0.05;
const RANDOM_STRING_BASE = 36;
const RANDOM_STRING_LENGTH = 9;
const LABEL_FONT_SIZE = 12;
const TITLE_FONT_SIZE = 14;

/**
 * Colorbar Component
 *
 * A component creating a colorbar with the d3 library.
 */
const Colorbar = ({
    stops,
    title,
    labels = {},
    barHeight = DEFAULT_BAR_HEIGHT,
    titleHeight = DEFAULT_TITLE_HEIGHT,
    labelHeight = DEFAULT_LABEL_HEIGHT
}) => {
    const containerRef = useRef(null);
    const [width, setWidth] = useState(0);
    const svgRef = useRef(null);

    // Use ResizeObserver for responsive sizing
    useEffect(() => {
        if (!containerRef.current) {
            return () => {};
        }
        const ro = new window.ResizeObserver(entries => {
            for (const entry of entries) {
                setWidth(entry.contentRect.width);
            }
        });
        ro.observe(containerRef.current);

        // Initial set
        setWidth(containerRef.current.offsetWidth || 0);

        return () => {
            ro.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!stops || !width) {return;}
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Process stops
        const entries = Object.entries(stops)
            .map(([v, colors]) => [parseFloat(v), colors])
            .sort((a, b) => a[0] - b[0]);
        const values = entries.map(([v]) => v);
        const colors = entries.map(([, c]) => c);

        // Scale value to position
        const scale = d3.scaleLinear()
            .domain([Math.min(...values), Math.max(...values)])
            .range([0, width]);

        // Define gradient
        const defs = svg.append("defs");
        const gradId = "grad-" + Math.random().toString(RANDOM_STRING_BASE).substr(2, RANDOM_STRING_LENGTH);
        const grad = defs.append("linearGradient")
            .attr("id", gradId)
            .attr("x1", "0%").attr("x2", "100%")
            .attr("y1", "0%").attr("y2", "0%");

        for (let i = 0; i < entries.length; ++i) {
            const pos = scale(entries[i][0]) / width * 100;
            grad.append("stop")
                .attr("offset", `${pos}%`)
                .attr("stop-color", colors[i][0]);
            grad.append("stop")
                .attr("offset", `${pos}%`)
                .attr("stop-color", colors[i][1]);
        }

        // Draw colorbar
        svg.append("rect")
            .attr("x", 0).attr("y", titleHeight)
            .attr("width", width)
            .attr("height", barHeight)
            .style("fill", `url(#${gradId})`)
            .style("stroke", "#444")
            .style("stroke-width", 1);

        // Draw labels (auto or provided)
        let labelEntries = Object.entries(labels || {});
        if (labelEntries.length === 0) {
            // Auto-generate labels from stops, but limit to available width
            const MIN_LABEL_SPACING = 60; // px, adjust as needed
            const maxLabels = Math.max(2, Math.floor(width / MIN_LABEL_SPACING));
            // Evenly pick up to maxLabels from stops
            const step = Math.max(1, Math.ceil(entries.length / maxLabels));
            labelEntries = entries
                .filter((_, i) => i % step === 0 || i === entries.length - 1) // always include last
                .map(([v]) => {
                    const p = (scale(v) / width).toFixed(4);
                    return [p, v.toString()];
                });
        }

        labelEntries.forEach(([pos, text]) => {
            const p = Math.max(0, Math.min(1, parseFloat(pos)));
            const xpos = p * width;
            let anchor = "middle";
            if (p <= LABEL_ALIGN_BUFFER) {anchor = "start";}
            else if (p >= 1 - LABEL_ALIGN_BUFFER) {anchor = "end";}
            svg.append("text")
                .attr("x", xpos)
                .attr("y", titleHeight + barHeight + labelHeight / 2)
                .attr("text-anchor", anchor)
                .attr("font-size", LABEL_FONT_SIZE)
                .attr("fill", "#222")
                .attr("dominant-baseline", "middle")
                .text(text);
        });

        // Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", titleHeight / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", TITLE_FONT_SIZE)
            .attr("fill", "#222")
            .attr("dominant-baseline", "middle")
            .text(title);

    }, [stops, labels, title, barHeight, width]);

    return (
        <div ref={containerRef} style={{ width: "100%" }}>
            <svg
                ref={svgRef}
                width={width || 1}
                height={titleHeight + barHeight + labelHeight}
                style={{ display: "block" }}
            />
        </div>
    );
};

Colorbar.propTypes = {
    /**
     * The stops to infer the colorbar from.
     */
    stops: PropTypes.object.isRequired,
    /**
     * The title of the colorbar.
     */
    title: PropTypes.string,
    /**
     * Labels for specific positions on the colorbar.
     * Keys are positions (0 to 1) and values are label texts.
     */
    labels: PropTypes.object,
    /**
     * Height of the colorbar.
     */
    barHeight: PropTypes.number,
    /**
     * Height of the title.
     */
    titleHeight: PropTypes.number,
    /**
     * Height of the labels.
     */
    labelHeight: PropTypes.number,
};

export default Colorbar;