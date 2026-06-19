/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React, {useState} from 'react';
import {X, Save, Plus, Trash2, AlertCircle} from 'lucide-react';
import Modal from '../shared/Modal';
import {VirtuosoProfile} from '../../services/virtuosos';

interface CustomVirtuosoBuilderProps {
  onClose: () => void;
  onSave: (virtuoso: VirtuosoProfile) => void;
  customVirtuosos: VirtuosoProfile[];
  onDelete?: (id: string) => void;
}

export default function CustomVirtuosoBuilder({onClose, onSave, customVirtuosos, onDelete}: CustomVirtuosoBuilderProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [model, setModel] = useState('gemini-2.5-pro');
  const [color, setColor] = useState('#8AB4F8');
  const [icon, setIcon] = useState('Bot');
  const [capabilities, setCapabilities] = useState<string[]>(['custom']);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const toggleCapability = (cap: string) => {
    if (capabilities.includes(cap)) {
      setCapabilities(capabilities.filter(c => c !== cap));
    } else {
      setCapabilities([...capabilities, cap]);
    }
  };

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!title.trim()) errors.title = 'Title is required';
    if (!description.trim()) errors.description = 'Description is required';
    if (!systemInstruction.trim()) errors.systemInstruction = 'System instruction is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    const newVirtuoso: VirtuosoProfile = {
      id: `custom-${Date.now()}` as any,
      name,
      title,
      description,
      systemInstruction,
      model,
      color,
      icon,
      capabilities: capabilities.length > 0 ? capabilities : ['custom'],
      config: capabilities.includes('googleSearch') ? { tools: [{ googleSearch: {} }] } : undefined,
    };

    onSave(newVirtuoso);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setTitle('');
    setDescription('');
    setSystemInstruction('');
    setModel('gemini-2.5-pro');
    setColor('#8AB4F8');
    setIcon('Bot');
    setCapabilities(['custom']);
    setValidationErrors({});
  };

  const allCaps = ['search_video', 'applyLens', 'seekToTime', 'setPlaybackSpeed', 'addAnnotation', 'setSelectionRange', 'googleSearch', 'generateImages'];

  return (
    <Modal isOpen={true} onClose={onClose} title={isCreating ? 'Create Custom Virtuoso' : 'Agent Studio'}
      contentClassName="modal-content custom-virtuoso-modal">
      <div className="modal-body">
        {!isCreating ? (
          <>
            <p className="builder-intro">
              Manage your custom AI agents. These agents will be available to the Conductor.
            </p>
            <button className="btn-primary builder-create-btn" onClick={() => setIsCreating(true)}>
              <Plus size={16} /> Create New Agent
            </button>

            <div className="virtuoso-list">
              {customVirtuosos.length === 0 ? (
                <div className="builder-empty">No custom agents yet.</div>
              ) : (
                customVirtuosos.map(v => (
                  <div key={v.id} className="virtuoso-list-item" style={{borderLeft: `4px solid ${v.color}`}}>
                    <div className="virtuoso-details">
                      <strong>{v.name}</strong>
                      <p>{v.title}</p>
                    </div>
                    {onDelete && (
                      <button className="virtuoso-delete-btn" onClick={() => onDelete(v.id)} title="Delete Agent">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setValidationErrors(prev => ({...prev, name: ''})); }}
                placeholder="e.g., The Code Reviewer"
                className={validationErrors.name ? 'input-error' : ''}
              />
              {validationErrors.name && (
                <span className="field-error"><AlertCircle size={12} /> {validationErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setValidationErrors(prev => ({...prev, title: ''})); }}
                placeholder="e.g., Senior Developer"
                className={validationErrors.title ? 'input-error' : ''}
              />
              {validationErrors.title && (
                <span className="field-error"><AlertCircle size={12} /> {validationErrors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={description}
                onChange={e => { setDescription(e.target.value); setValidationErrors(prev => ({...prev, description: ''})); }}
                placeholder="Briefly describe what this Virtuoso does..."
                className={validationErrors.description ? 'input-error' : ''}
              />
              {validationErrors.description && (
                <span className="field-error"><AlertCircle size={12} /> {validationErrors.description}</span>
              )}
            </div>

            <div className="form-group">
              <label>System Instruction</label>
              <textarea
                value={systemInstruction}
                onChange={e => { setSystemInstruction(e.target.value); setValidationErrors(prev => ({...prev, systemInstruction: ''})); }}
                placeholder="You are a specialized agent. Your task is to..."
                rows={5}
                className={validationErrors.systemInstruction ? 'input-error' : ''}
              />
              {validationErrors.systemInstruction && (
                <span className="field-error"><AlertCircle size={12} /> {validationErrors.systemInstruction}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Model</label>
                <select value={model} onChange={e => setModel(e.target.value)}>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                </select>
              </div>
              <div className="form-group">
                <label>Color</label>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label>Capabilities (Tools)</label>
              <div className="capability-checkboxes">
                {allCaps.map(cap => (
                  <label key={cap} className="capability-label">
                    <input
                      type="checkbox"
                      checked={capabilities.includes(cap)}
                      onChange={() => toggleCapability(cap)}
                    />
                    {cap}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {isCreating && (
        <div className="modal-footer">
          <button onClick={() => { setIsCreating(false); setValidationErrors({}); }} className="btn-secondary">Back</button>
          <button onClick={handleSave} className="btn-primary">
            <Save size={16} /> Save Virtuoso
          </button>
        </div>
      )}
    </Modal>
  );
}