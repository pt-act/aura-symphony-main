import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check, Server, Key, Cpu, AlertCircle, Loader, Zap } from 'lucide-react';
import {
  ProviderConfig,
  loadProviders,
  saveProviders,
  getActiveProvider as getActiveProviderBase,
} from '../../lib/provider-config';
import {testProviderConnection} from '../../api/client';
import {styles} from './providerSettingsCardStyles';

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
      name: '',
      baseUrl: '',
      apiKey: '',
      model: '',
      isActive: false,
    };
    setProviders(prev => [...prev, newProvider]);
    setEditingId(newProvider.id);
  };

  const updateProvider = (id: string, field: keyof ProviderConfig, value: string | boolean) => {
    setProviders(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const deleteProvider = (id: string) => {
    setProviders(prev => prev.filter(p => p.id !== id));
  };

  const activateProvider = (id: string) => {
    setProviders(prev =>
      prev.map(p => ({ ...p, isActive: p.id === id }))
    );
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
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Server size={20} color="var(--accent-color)" />
          <div>
            <h2 style={styles.title}>AI Provider Settings</h2>
            <p style={styles.subtitle}>Configure base URL, API key, and model for each provider</p>
          </div>
        </div>
        <button onClick={handleSave} style={saved ? styles.savedBtn : styles.saveBtn}>
          {saved ? <><Check size={14} /> Saved</> : 'Save'}
        </button>
      </div>

      {/* Active Provider Badge */}
      {activeProvider && (
        <div style={styles.activeBadge}>
          <span style={styles.activeDot} />
          Active: {activeProvider.name || activeProvider.model || 'Unnamed'}
        </div>
      )}

      {/* Provider List */}
      <div style={styles.providerList}>
        {providers.map(provider => {
          const isEditing = editingId === provider.id;
          return (
            <div
              key={provider.id}
              style={{
                ...styles.providerRow,
                borderColor: provider.isActive ? 'var(--accent-color)' : 'var(--border-color)',
              }}
            >
              {/* Provider Header */}
              <div style={styles.providerHeader}>
                <div style={styles.providerHeaderLeft}>
                  <button
                    onClick={() => activateProvider(provider.id)}
                    style={{
                      ...styles.radioBtn,
                      background: provider.isActive ? 'var(--accent-color)' : 'transparent',
                    }}
                    title="Set as active"
                  />
                  <input
                    type="text"
                    value={provider.name}
                    onChange={e => updateProvider(provider.id, 'name', e.target.value)}
                    placeholder="Provider name"
                    style={styles.nameInput}
                    onFocus={() => setEditingId(provider.id)}
                  />
                </div>
                <div style={styles.providerActions}>
                  {providers.length > 1 && (
                    <button
                      onClick={() => deleteProvider(provider.id)}
                      style={styles.iconBtn}
                      title="Delete provider"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Fields */}
              <div style={{ ...styles.fields, display: isEditing ? 'flex' : 'none' }}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    <Server size={12} /> Base URL
                  </label>
                  <input
                    type="text"
                    value={provider.baseUrl}
                    onChange={e => updateProvider(provider.id, 'baseUrl', e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="settings-card-input"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    <Key size={12} /> API Key
                  </label>
                  <div style={styles.keyInputWrapper}>
                    <input
                      type={showKeys[provider.id] ? 'text' : 'password'}
                      value={provider.apiKey}
                      onChange={e => updateProvider(provider.id, 'apiKey', e.target.value)}
                      placeholder="sk-..."
                      className="settings-card-input"
                      style={{ ...styles.input, paddingRight: '36px' }}
                    />
                    <button
                      onClick={() => toggleKeyVisibility(provider.id)}
                      style={styles.eyeBtn}
                      title={showKeys[provider.id] ? 'Hide' : 'Show'}
                    >
                      {showKeys[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>
                    <Cpu size={12} /> Model
                  </label>
                  <input
                    type="text"
                    value={provider.model}
                    onChange={e => updateProvider(provider.id, 'model', e.target.value)}
                    placeholder="e.g. gpt-4o, claude-sonnet-4, gemini-2.5-pro"
                    className="settings-card-input"
                    style={styles.input}
                  />
                </div>

                {/* Test Connection */}
                <div style={styles.testConnectionRow}>
                  <button
                    onClick={() => handleTestConnection(provider)}
                    disabled={testState[provider.id] === 'testing'}
                    style={{
                      ...styles.testBtn,
                      ...(testState[provider.id] === 'testing' ? styles.testBtnDisabled : {}),
                      ...(testState[provider.id] === 'ok' ? styles.testBtnOk : {}),
                      ...(testState[provider.id] === 'fail' ? styles.testBtnFail : {}),
                    }}
                  >
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
                    <span style={styles.testErrorText}>{testError[provider.id]}</span>
                  )}
                </div>
              </div>

              {/* Collapsed Summary */}
              {!isEditing && (
                <div
                  style={styles.collapsedSummary}
                  onClick={() => setEditingId(provider.id)}
                >
                  <span style={styles.summaryText}>
                    {provider.model || 'No model set'}
                    {provider.baseUrl ? ` · ${new URL(provider.baseUrl).hostname}` : ''}
                  </span>
                  <span style={styles.editHint}>Click to edit</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <button onClick={addProvider} style={styles.addBtn}>
        <Plus size={16} /> Add Provider
      </button>

      {/* Info */}
      <div style={styles.infoBox}>
        <AlertCircle size={14} color="var(--secondary-text-color)" />
        <span>
          Supports any OpenAI-compatible API (OpenAI, Anthropic via proxy, local LLMs, Ollama, etc.)
        </span>
      </div>
    </div>
  );
}

// getActiveProvider is re-exported from provider-config above
