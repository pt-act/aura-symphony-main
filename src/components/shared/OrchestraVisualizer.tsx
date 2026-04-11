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

import {AnimatePresence, motion} from 'motion/react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Zap,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import React from 'react';
import {useSymphony} from '../../hooks/useSymphony';
import {VIRTUOSO_REGISTRY} from '../../services/virtuosos';
import type {Task} from '../../lib/symphonyBus';

function VirtuosoItem({task}: {task: Task; key?: React.Key}) {
  const profile = VIRTUOSO_REGISTRY[task.virtuosoId];
  const Icon = (LucideIcons as any)[profile?.icon] || Cpu;
  const color = profile?.color || '#8ab4f8';

  return (
    <motion.div
      layout
      initial={{opacity: 0, x: 20, scale: 0.9}}
      animate={{opacity: 1, x: 0, scale: 1}}
      exit={{opacity: 0, scale: 0.9, transition: {duration: 0.2}}}
      className={`virtuoso-card ${task.status}`}
      style={{'--accent-color': color} as any}
    >
      <div className="virtuoso-icon-wrapper">
        <Icon size={18} />
        {task.status === 'running' && (
          <motion.div
            className="virtuoso-pulse"
            animate={{scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5]}}
            transition={{duration: 2, repeat: Infinity}}
          />
        )}
      </div>
      
      <div className="virtuoso-info">
        <div className="virtuoso-name-row">
          <span className="virtuoso-label">{profile?.title || 'Virtuoso'}</span>
          <span className="virtuoso-name">{task.name}</span>
        </div>
        
        <div className="virtuoso-status-row">
          {task.status === 'running' ? (
            <div className="virtuoso-progress-bar">
              <motion.div 
                className="virtuoso-progress-fill"
                animate={{x: ['-100%', '100%']}}
                transition={{duration: 1.5, repeat: Infinity, ease: "linear"}}
              />
            </div>
          ) : (
            <div className="virtuoso-status-message">
              {task.status === 'success' ? (
                <><CheckCircle2 size={12} /> Complete</>
              ) : (
                <><AlertCircle size={12} /> {task.error || 'Failed'}</>
              )}
            </div>
          )}
        </div>
      </div>

      {task.status === 'running' && (
        <div className="virtuoso-activity">
          <Activity size={14} className="animate-pulse" />
        </div>
      )}
    </motion.div>
  );
}

export default function OrchestraVisualizer() {
  const {tasks} = useSymphony();

  return (
    <div className="orchestra-visualizer">
      <div className="orchestra-header">
        <div className="orchestra-title">
          <Zap size={14} className="text-accent" />
          <span>Active Orchestra</span>
        </div>
        <div className="orchestra-count">
          {tasks.filter(t => t.status === 'running').length} Active
        </div>
      </div>
      
      <div className="orchestra-stage">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <VirtuosoItem key={task.id} task={task as any} />
          ))}
        </AnimatePresence>
        
        {tasks.length === 0 && (
          <div className="orchestra-idle">
            <span className="idle-dot" />
            Orchestra Idle
          </div>
        )}
      </div>
    </div>
  );
}
