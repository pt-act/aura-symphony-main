/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
/* tslint:disable */
import {max, min} from 'd3-array';
import {scaleBand, scaleLinear} from 'd3-scale';
import {line} from 'd3-shape';
import React, {useEffect, useRef, useState} from 'react';
import {timeToSecs} from '../../lib/utils';

interface ChartProps {
  data: {time: string; value: number}[];
  yLabel: string;
  jumpToTimecode: (seconds: number) => void;
}

export default function Chart({data, yLabel, jumpToTimecode}: ChartProps) {
  const chartRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const margin = 55;
  const xMax = width;
  const yMax = height - margin;
  const xScale = scaleBand()
    .range([margin + 10, xMax])
    .domain(data.map((d) => d.time))
    .padding(0.2);

  const vals = data.map((d) => d.value);
  const yScale = scaleLinear()
    .domain([min(vals) || 0, max(vals) || 0])
    .nice()
    .range([yMax, margin]);

  const yTicks = yScale.ticks(Math.floor(height / 70));

  const lineGen = line<{time: string; value: number}>()
    .x((d) => xScale(d.time)!)
    .y((d) => yScale(d.value));

  useEffect(() => {
    const setSize = () => {
      if (chartRef.current) {
        setWidth(chartRef.current.clientWidth);
        setHeight(chartRef.current.clientHeight);
      }
    };

    setSize();
    addEventListener('resize', setSize);
    return () => removeEventListener('resize', setSize);
  }, []);

  return (
    <svg className="lineChart" ref={chartRef}>
      <g className="axisLabels" transform={`translate(0 ${0})`}>
        {yTicks.map((tick) => {
          const y = yScale(tick);

          return (
            <g key={tick} transform={`translate(0 ${y})`}>
              <text x={margin - 10} dy="0.25em" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}
      </g>

      <g
        className="axisLabels timeLabels"
        transform={`translate(0 ${yMax + 40})`}>
        {data.map(({time}, i) => {
          return (
            <text
              key={i}
              x={xScale(time)}
              role="button"
              onClick={() => jumpToTimecode(timeToSecs(time))}>
              {time.length > 5 ? time.replace(/^00:/, '') : time}
            </text>
          );
        })}
      </g>

      <g>
        <path d={lineGen(data)} />
      </g>

      <g>
        {data.map(({time, value}, i) => {
          return (
            <g key={i} className="dataPoint">
              <circle cx={xScale(time)} cy={yScale(value)} r={4} />

              <text x={xScale(time)} y={yScale(value) - 12}>
                {value}
              </text>
            </g>
          );
        })}
      </g>

      <text
        className="axisTitle"
        x={margin}
        y={-width + margin}
        transform="rotate(90)">
        {yLabel}
      </text>
    </svg>
  );
}