/**
 * All Rights Reserved.
 * Copyright (c) 2025 Ricardo Nuno Quintas de Almeida.
 *
 * No part of this software may be copied, modified, distributed,
 * or used in any form without prior express written permission.
 * UNAUTHORIZED USE IS STRICTLY PROHIBITED.
 */
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check, Server, Key, Cpu, AlertCircle, Loader, Zap } from 'lucide-react';
import {
  ProviderConfig,
  loadProviders,
  saveProviders,
  getActiveProvider as getActiveProviderBase,
} from '../../lib/provider-config';
import {testProviderConnection} from '../../api/client';

// Re-export for consumers that imported from this file
export type { ProviderConfig };
export { getActiveProviderBase as getActiveProvider };

export default function ProviderSettingsCard() {
  const [providers, setProviders] = useState<ProviderConfig[]>(loadProviders);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [testState, setTestState] = useState<Record<string, 'idle' | 'testing' | 'ok' | 'fail'>>({});
  const [testError, setTestError] = useState<Record<string, string>>({});

  useEffect(() => {
    saveProviders(providers);
  }, [providers]);

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addProvider = () => {
    const newProvider: ProviderConfig = {
      id: `provider-${Date.now()}`,
      name: '', baseUrl: '', apiKey: '', model: '', isActive: false,
    };
    setProviders(prev => [...prev, newProvider]);
    setEditingId(newProvider.id);
  };

  const updateProvider = (id: string, field: keyof ProviderConfig, value: string | boolean) => {
    setProviders(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const deleteProvider = (id: string) => {
    setProviders(prev => prev.filter(p => p.id !== id));
  };

  const activateProvider = (id: string) => {
    setProviders(prev => prev.map(p => ({ ...p, isActive: p.id === id })));
  };

  const handleSave = () => {
    saveProviders(providers);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTestConnection = async (provider: ProviderConfig) => {
    if (!provider.apiKey?.trim()) {
      setTestState(prev => ({...prev, [provider.id]: 'fail'}));
      setTestError(prev => ({...prev, [provider.id]: 'No API key entered.'}));
      return;
    }
    setTestState(prev => ({...prev, [provider.id]: 'testing'}));
    setTestError(prev => ({...prev, [provider.id]: ''}));
    const result = await testProviderConnection(provider.apiKey, provider.model);
    if (result.ok) {
      setTestState(prev => ({...prev, [provider.id]: 'ok'}));
    } else {
      setTestState(prev => ({...prev, [provider.id]: 'fail'}));
      setTestError(prev => ({...prev, [provider.id]: result.error}));
    }
    setTimeout(() => {
      setTestState(prev => ({...prev, [provider.id]: 'idle'}));
    }, 4000);
  };

  const activeProvider = providers.find(p => p.isActive);

  return (
    <div className="settings-card">
      <div className="settings-card-header">
        <div className="settings-card-header-left">
          <Server size={20} className="settings-card-icon" />
          <div>
            <h2 className="settings-card-title">AI Provider Settings</h2>
            <p className="settings-card-subtitle">Configure base URL, API key, and model for each provider</p>
          </div>
        </div>
        <button onClick={handleSave} className={saved ? 'settings-save-btn saved' : 'settings-save-btn'}>
          {saved ? <><Check size={14} /> Saved</> : 'Save'}
        </button>
      </div>

      {activeProvider && (
        <div className="settings-active-badge">
          <span className="settings-active-dot" />
          Active: {activeProvider.name || activeProvider.model || 'Unnamed'}
        </div>
      )}

      <div className="settings-provider-list">
        {providers.map(provider => {
          const isEditing = editingId === provider.id;
          return (
            <div
              key={provider.id}
              className={`settings-provider-row ${provider.isActive ? 'active' : ''}`}>
              <div className="settings-provider-header">
                <div className="settings-provider-header-left">
                  <button
                    onClick={() => activateProvider(provider.id)}
                    className={`settings-radio-btn ${provider.isActive ? 'active' : ''}`}
                    title="Set as active"
                  />
                  <input
                    type="text"
                    value={provider.name}
                    onChange={e => updateProvider(provider.id, 'name', e.target.value)}
                    placeholder="Provider name"
                    className="settings-name-input"
                    onFocus={() => setEditingId(provider.id)}
                  />
                </div>
                <div className="settings-provider-actions">
                  {providers.length > 1 && (
                    <button
                      onClick={() => deleteProvider(provider.id)}
                      className="settings-icon-btn"
                      title="Delete provider">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className={`settings-fields ${isEditing ? 'open' : ''}`}>
                <div className="settings-field-group">
                  <label className="settings-label"><Server size={12} /> Base URL</label>
                  <input
                    type="text"
                    value={provider.baseUrl}
                    onChange={e => updateProvider(provider.id, 'baseUrl', e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="settings-card-input"
                  />
                </div>

                <div className="settings-field-group">
                  <label className="settings-label"><Key size={12} /> API Key</label>
                  <div className="settings-key-input-wrapper">
                    <input
                      type={showKeys[provider.id] ? 'text' : 'password'}
                      value={provider.apiKey}
                      onChange={e => updateProvider(provider.id, 'apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="settings-card-input settings-key-input"
                    />
                    <button
                      onClick={() => toggleKeyVisibility(provider.id)}
                      className="settings-eye-btn"
                      title={showKeys[provider.id] ? 'Hide' : 'Show'}>
                      {showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="settings-field-group">
                  <label className="settings-label"><Cpu size={12} /> Model</label>
                  <input
                    type="text"
                    value={provider.model}
                    onChange={e => updateProvider(provider.id, 'model', e.target.value)}
                    placeholder="e.g. gpt-4o, claude-sonnet-4, gemini-2.5-pro"
                    className="settings-card-input"
                  />
                </div>

                <div className="settings-test-row">
                  <button
                    onClick={() => handleTestConnection(provider)}
                    disabled={testState[provider.id] === 'testing'}
                    className={`settings-test-btn state-${testState[provider.id]}`}>
                    {testState[provider.id] === 'testing' ? (
                      <><Loader size={13} className="spin-icon" /> Testing…</>
                    ) : testState[provider.id] === 'ok' ? (
                      <><Check size={13} /> Connected!</>
                    ) : testState[provider.id] === 'fail' ? (
                      <><AlertCircle size={13} /> Failed</>
                    ) : (
                      <><Zap size={13} /> Test Connection</>
                    )}
                  </button>
                  {testState[provider.id] === 'fail' && testError[provider.id] && (
                    <span className="settings-test-error">{testError[provider.id]}</span>
                  )}
                </div>
              </div>

              {!isEditing && (
                <div className="settings-collapsed-summary" onClick={() => setEditingId(provider.id)}>
                  <span className="settings-summary-text">
                    {provider.model || 'No model set'}
                    {provider.baseUrl ? ` · ${new URL(provider.baseUrl).hostname}` : ''}
                  </span>
                  <span className="settings-edit-hint">Click to edit</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={addProvider} className="settings-add-btn">
        <Plus size={16} /> Add Provider
      </button>

      <div className="settings-info-box">
        <AlertCircle size={14} />
        <span>Supports any OpenAI-compatible API (OpenAI, Anthropic via proxy, local LLMs, Ollama, etc.)</span>
      </div>
    </div>
  );
}