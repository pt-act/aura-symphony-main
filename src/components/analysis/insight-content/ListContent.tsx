/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
/* tslint:disable */
import c from 'classnames';
import React, {useMemo} from 'react';
import {timeToSecs} from '../../../lib/utils';

interface ListContentProps {
  data: {time: string; text: string}[];
  currentTime: number;
  duration: number;
  jumpToTimecode: (time: number) => void;
}

export default function ListContent({
  data,
  currentTime,
  duration,
  jumpToTimecode,
}: ListContentProps) {
  const dataWithSecs = useMemo(
    () => data.map((d) => ({...d, secs: timeToSecs(d.time)})),
    [data],
  );

  return (
    <ul className="transcript-list">
      {dataWithSecs.map((item, i) => {
        const nextItem = dataWithSecs[i + 1];
        const isActive =
          currentTime >= item.secs &&
          (nextItem ? currentTime < nextItem.secs : currentTime <= duration);

        return (
          <li
            key={i}
            className={c('outputItem', {active: isActive})}
            onClick={() => jumpToTimecode(item.secs)}>
            <time>{item.time}</time>
            <p className="text">{item.text}</p>
          </li>
        );
      })}
    </ul>
  );
}