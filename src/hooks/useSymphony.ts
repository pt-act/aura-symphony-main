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

import {useEffect, useState} from 'react';
import {Events, symphonyBus, Task} from '../lib/symphonyBus';

export const useSymphony = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const handleTaskStart = (event: Event) => {
      const {id, name, virtuosoId} = (event as CustomEvent).detail;
      setTasks((prev) => [
        ...prev,
        {id, name, virtuosoId, status: 'running', createdAt: Date.now()},
      ]);
    };

    const handleTaskSuccess = (event: Event) => {
      const {id, result} = (event as CustomEvent).detail;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? {...t, status: 'success', result} : t)),
      );
    };

    const handleTaskError = (event: Event) => {
      const {id, error} = (event as CustomEvent).detail;
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? {...t, status: 'error', error} : t)),
      );
    };

    symphonyBus.listen(Events.TASK_START, handleTaskStart);
    symphonyBus.listen(Events.TASK_SUCCESS, handleTaskSuccess);
    symphonyBus.listen(Events.TASK_ERROR, handleTaskError);

    return () => {
      symphonyBus.unlisten(Events.TASK_START, handleTaskStart);
      symphonyBus.unlisten(Events.TASK_SUCCESS, handleTaskSuccess);
      symphonyBus.unlisten(Events.TASK_ERROR, handleTaskError);
    };
  }, []);

  // Auto-clear successful/error tasks after a delay
  useEffect(() => {
    const timers: number[] = [];
    tasks.forEach((task) => {
      if (task.status === 'success' || task.status === 'error') {
        const timer = window.setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
        }, 5000); // 5 seconds
        timers.push(timer);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [tasks]);

  return {tasks};
};