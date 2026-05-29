/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
/* tslint:disable */
import React from 'react';
import {timeToSecs} from '../../../lib/utils';

interface TableContentProps {
  data: {time: string; text: string; objects: string[]}[];
  jumpToTimecode: (time: number) => void;
}

export default function TableContent({data, jumpToTimecode}: TableContentProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Description</th>
          <th>Objects</th>
        </tr>
      </thead>
      <tbody>
        {data.map(({time, text, objects}: any, i: number) => (
          <tr
            key={i}
            role="button"
            onClick={() => jumpToTimecode(timeToSecs(time))}>
            <td>
              <time>{time}</time>
            </td>
            <td>{text}</td>
            <td>{objects.join(', ')}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}