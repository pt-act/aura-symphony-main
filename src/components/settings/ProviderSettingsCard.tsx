import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Check, Server, Key, Cpu, AlertCircle } from 'lucide-react';

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  isActive: boolean;
}

const STORAGE_KEY = 'aura-symphony-providers';

const defaultProviders: ProviderConfig[] = [
  {
    id: 'google-default',
    name: 'Google AI (Default)',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: '',
    model: 'gemini-2.5-pro',
    isActive: true,
  },
];

function loadProviders(): ProviderConfig[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultProviders;
}

function saveProviders(providers: ProviderConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
}

export default function ProviderSettingsCard() {
  const [providers, setProviders] = useState<ProviderConfig[]>(loadProviders);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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

// Export for use by other components
export function getActiveProvider(): ProviderConfig | null {
  const providers = loadProviders();
  return providers.find(p => p.isActive) || null;
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '0',
    maxWidth: '600px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-color)',
    background: '#252525',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--primary-text-color)',
  },
  subtitle: {
    margin: 0,
    fontSize: '0.75rem',
    color: 'var(--secondary-text-color)',
    marginTop: '2px',
  },
  saveBtn: {
    background: 'var(--accent-color)',
    border: 'none',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
    fontFamily: 'inherit',
  },
  savedBtn: {
    background: '#34A853',
    border: 'none',
    color: 'white',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'default',
    fontSize: '0.8rem',
    fontWeight: 500,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  activeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 20px',
    fontSize: '0.75rem',
    color: 'var(--accent-color)',
    background: 'rgba(138, 180, 248, 0.08)',
    borderBottom: '1px solid var(--border-color)',
  },
  activeDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#34A853',
  },
  providerList: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 20px',
    gap: '12px',
  },
  providerRow: {
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  providerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.02)',
  },
  providerHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
  },
  radioBtn: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: '2px solid var(--accent-color)',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  nameInput: {
    background: 'transparent',
    border: 'none',
    color: 'var(--primary-text-color)',
    fontSize: '0.9rem',
    fontWeight: 500,
    fontFamily: 'inherit',
    flex: 1,
    outline: 'none',
    minWidth: 0,
  },
  providerActions: {
    display: 'flex',
    gap: '4px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--secondary-text-color)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'inherit',
  },
  fields: {
    flexDirection: 'column',
    gap: '12px',
    padding: '0 12px 12px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '0.75rem',
    color: 'var(--secondary-text-color)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    background: 'var(--background-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '8px 10px',
    color: 'var(--primary-text-color)',
    fontSize: '0.85rem',
    fontFamily: "'Space Mono', monospace",
    width: '100%',
    boxSizing: 'border-box',
  },
  keyInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    color: 'var(--secondary-text-color)',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  collapsedSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    cursor: 'pointer',
  },
  summaryText: {
    fontSize: '0.75rem',
    color: 'var(--secondary-text-color)',
    fontFamily: "'Space Mono', monospace",
  },
  editHint: {
    fontSize: '0.7rem',
    color: 'var(--accent-color)',
    opacity: 0.6,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    margin: '0 20px 16px',
    padding: '10px',
    background: 'transparent',
    border: '1px dashed var(--border-color)',
    borderRadius: '8px',
    color: 'var(--secondary-text-color)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, color 0.2s',
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    fontSize: '0.72rem',
    color: 'var(--secondary-text-color)',
    borderTop: '1px solid var(--border-color)',
    background: 'rgba(255,255,255,0.01)',
  },
};
