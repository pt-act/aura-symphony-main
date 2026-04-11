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

/**
 * The Symphony Bus
 * A simple event bus for decoupled communication between app components.
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
   */
  commission(virtuosoId: VirtuosoType, taskName: string, taskId: string | number = Math.random().toString(36).substring(7)) {
    this.dispatch(Events.TASK_START, {
      id: taskId,
      name: taskName,
      virtuosoId
    });
    return taskId;
  }
}

export const symphonyBus = new SymphonyBus();

export const Events = {
  TASK_START: 'task:start',
  TASK_PROGRESS: 'task:progress',
  TASK_SUCCESS: 'task:success',
  TASK_ERROR: 'task:error',
};

export interface Task {
  id: string | number;
  name: string;
  virtuosoId: VirtuosoType;
  status: 'running' | 'success' | 'error';
  progress?: number;
  result?: any;
  error?: string;
  createdAt: number;
}