/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import c from 'classnames';
import React from 'react';
import {timeToSecs} from '../../../lib/utils';

interface TextModuleProps {
  title: string;
  data: {time: string; text: string}[];
  jumpToTimecode: (time: number) => void;
  isSummary?: boolean;
  highlightedTime?: string | null;
}

export default function TextModule({
  title,
  data,
  jumpToTimecode,
  isSummary = false,
  highlightedTime,
}: TextModuleProps) {
  return (
    <div className="learning-module text-module">
      <h3>{title}</h3>
      {isSummary ? (
        <p>
          {data.map((item, i) => (
            <span
              key={i}
              className={c('clickable-sentence', {
                highlighted: item.time === highlightedTime,
              })}
              onClick={() => jumpToTimecode(timeToSecs(item.time))}>
              {item.text}{' '}
            </span>
          ))}
        </p>
      ) : (
        <ul>
          {data.map((item, i) => (
            <li
              key={i}
              className={c('clickable-item', {
                highlighted: item.time === highlightedTime,
              })}
              onClick={() => jumpToTimecode(timeToSecs(item.time))}>
              <time>{item.time}</time>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}