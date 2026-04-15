import React, { useState, useEffect } from 'react';
import { VirtuosoProfile, VIRTUOSO_REGISTRY } from '../../services/virtuosos';
import { X, Save, Plus, Trash2 } from 'lucide-react';

interface CustomVirtuosoBuilderProps {
  onClose: () => void;
  onSave: (virtuoso: VirtuosoProfile) => void;
  customVirtuosos: VirtuosoProfile[];
  onDelete?: (id: string) => void;
}

export default function CustomVirtuosoBuilder({ onClose, onSave, customVirtuosos, onDelete }: CustomVirtuosoBuilderProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [model, setModel] = useState('gemini-2.5-pro');
  const [color, setColor] = useState('#8AB4F8');
  const [icon, setIcon] = useState('Bot');
  const [capabilities, setCapabilities] = useState<string[]>(['custom']);

  const toggleCapability = (cap: string) => {
    if (capabilities.includes(cap)) {
      setCapabilities(capabilities.filter(c => c !== cap));
    } else {
      setCapabilities([...capabilities, cap]);
    }
  };

  const handleSave = () => {
    if (!name || !title || !description || !systemInstruction) {
      alert('Please fill out all required fields.');
      return;
    }

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
  };

  return (
    <div className="custom-virtuoso-modal-overlay">
      <div className="custom-virtuoso-modal" style={{ maxWidth: isCreating ? '600px' : '400px' }}>
        <div className="modal-header">
          <h2>{isCreating ? 'Create Custom Virtuoso' : 'Agent Studio'}</h2>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        
        {!isCreating ? (
          <div className="modal-body">
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                Manage your custom AI agents. These agents will be available to the Conductor.
              </p>
              <button 
                className="btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={() => setIsCreating(true)}
              >
                <Plus size={16} /> Create New Agent
              </button>
            </div>
            
            <div className="virtuoso-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
              {customVirtuosos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '14px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                  No custom agents yet.
                </div>
              ) : (
                customVirtuosos.map(v => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: `4px solid ${v.color}` }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{v.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v.title}</div>
                    </div>
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(v.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--error-color, #ff4d4f)', cursor: 'pointer', padding: '4px' }}
                        title="Delete Agent"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., The Code Reviewer" />
              </div>
              
              <div className="form-group">
                <label>Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Senior Developer" />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what this Virtuoso does..." />
              </div>
              
              <div className="form-group">
                <label>System Instruction</label>
                <textarea 
                  value={systemInstruction} 
                  onChange={e => setSystemInstruction(e.target.value)} 
                  placeholder="You are a specialized agent. Your task is to..."
                  rows={5}
                />
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
                <div className="capabilities-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['search_video', 'applyLens', 'seekToTime', 'setPlaybackSpeed', 'addAnnotation', 'setSelectionRange', 'googleSearch', 'generateImages'].map(cap => (
                    <label key={cap} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
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
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setIsCreating(false)} className="btn-secondary">Back</button>
              <button onClick={handleSave} className="btn-primary">
                <Save size={16} style={{ marginRight: '8px' }} />
                Save Virtuoso
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
