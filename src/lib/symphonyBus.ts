/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {VirtuosoType} from '../services/virtuosos';
import {logVirtuosoCommission, startTimer, logVirtuosoResult} from './telemetry';

/**
 * The Symphony Bus
 * A real-time event bus for decoupled communication between app components
 * and AI Virtuosos. Supports task lifecycle, commission delegation, and
 * agent-to-agent chaining.
 */
class SymphonyBus extends EventTarget {
  listen(type: string, listener: EventListenerOrEventListenerObject | null) {
    this.addEventListener(type, listener);
  }

  unlisten(type: string, listener: EventListenerOrEventListenerObject | null) {
    this.removeEventListener(type, listener);
  }

  dispatch<T>(type: string, detail: T) {
    this.dispatchEvent(new CustomEvent(type, {detail}));
  }

  /**
   * Commissions a specific Virtuoso to perform a task.
   * Logs the commission via telemetry.
   */
  commission(virtuosoId: VirtuosoType, taskName: string, taskId: string | number = Math.random().toString(36).substring(7)) {
    logVirtuosoCommission(virtuosoId, taskName, taskId);
    this.dispatch(Events.TASK_START, {
      id: taskId,
      name: taskName,
      virtuosoId
    });
    return taskId;
  }

  /**
   * Reports a task result (success or error) and logs via telemetry.
   */
  reportResult(taskId: string | number, virtuosoId: VirtuosoType | string, success: boolean, result: unknown, durationMs?: number) {
    if (success) {
      this.dispatch(Events.TASK_SUCCESS, {id: taskId, result});
    } else {
      this.dispatch(Events.TASK_ERROR, {id: taskId, error: String(result)});
    }
    logVirtuosoResult(virtuosoId, taskId, success, durationMs ?? 0);
  }

  /**
   * Chains a commission: one Virtuoso delegates a sub-task to another.
   * Creates a parent-child relationship between tasks.
   *
   * @param parentId - The originating task ID
   * @param childVirtuoso - The Virtuoso to handle the sub-task
   * @param childTaskName - Description of the sub-task
   * @param context - Optional context to pass to the child Virtuoso
   * @returns The child task ID
   */
  chainCommission(
    parentId: string | number,
    childVirtuoso: VirtuosoType,
    childTaskName: string,
    context?: Record<string, unknown>,
  ): string {
    const childId = `${parentId}::${childVirtuoso}::${Math.random().toString(36).substring(7)}`;

    this.dispatch(Events.COMMISSION_CHAIN, {
      parentId,
      childId,
      childVirtuoso,
      childTaskName,
      context,
      createdAt: Date.now(),
    });

    // Also start the child task normally so the visualizer picks it up
    this.commission(childVirtuoso, childTaskName, childId);

    return childId;
  }
}

export const symphonyBus = new SymphonyBus();

export const Events = {
  TASK_START: 'task:start',
  TASK_PROGRESS: 'task:progress',
  TASK_SUCCESS: 'task:success',
  TASK_ERROR: 'task:error',
  COMMISSION_CHAIN: 'commission:chain',
};

export interface Task {
  id: string | number;
  name: string;
  virtuosoId: VirtuosoType;
  status: 'running' | 'success' | 'error';
  progress?: number;
  result?: unknown;
  error?: string;
  createdAt: number;
}