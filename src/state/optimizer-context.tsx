import React, { createContext, useContext, useMemo, useReducer } from 'react'
import { useOptimizerStorageSync } from '@/src/hooks'

export type UIStep =
  | 'landing'
  | 'resume'
  | 'apiKey'
  | 'job'
  | 'optimizing'
  | 'results'
  | 'error'

export type ApiKeyStatus = 'idle' | 'validating' | 'saved' | 'error'

export type ToastTone = 'success' | 'info' | 'warning' | 'error'

export interface ToastMessage {
  id: string
  message: string
  tone: ToastTone
  dismissible?: boolean
}

export interface OptimizationChange {
  type: string
  section: string
  description?: string
  before?: string
  after?: string
  reason?: string
}

export interface OptimizationMetadata {
  improvementsCount?: number
  keywordsMatched?: string[]
  timestamp?: string
  wordCount?: number
  processingTimeSeconds?: number
  changes?: OptimizationChange[]
}

export interface DiffItem {
  path: string[]
  before: string
  after: string
}

export interface OptimizerState {
  uiStep: UIStep
  resume: {
    originalText: string
    optimizedText: string
    optimizedJson: string | null
    workspaceJson: string | null
    loadedSource: {
      type: 'none' | 'custom' | 'example'
      id: string | null
    }
  }
  jobDescription: {
    text: string
    lastUpdated: string | null
  }
  apiKey: {
    value: string | null
    maskedValue: string | null
    status: ApiKeyStatus
    errorMessage: string | null
  }
  metadata: OptimizationMetadata | null
  ui: {
    isApiKeyModalOpen: boolean
    activeVideoId: string | null
    isLoading: boolean
    errorMessage: string | null
    isDemoMode: boolean
  }
  optimization: {
    status: 'idle' | 'running' | 'success' | 'error'
    errorMessage: string | null
    diffItems: DiffItem[]
    showDiff: boolean
  }
  toasts: ToastMessage[]
}

export type OptimizerAction =
  | { type: 'SET_STEP'; step: UIStep }
  | { type: 'SET_RESUME_TEXT'; text: string }
  | { type: 'SET_JOB_DESCRIPTION'; text: string }
  | { type: 'SET_WORKSPACE_RESUME'; json: string | null }
  | { type: 'SET_LOADED_SOURCE'; source: { type: 'none' | 'custom' | 'example'; id: string | null } }
  | { type: 'SHOW_API_KEY_MODAL' }
  | { type: 'HIDE_API_KEY_MODAL' }
  | { type: 'SAVE_API_KEY'; key: string }
  | { type: 'CLEAR_API_KEY' }
  | { type: 'SET_API_KEY_STATUS'; status: ApiKeyStatus; errorMessage?: string | null }
  | {
    type: 'OPTIMIZE_REQUEST'
  }
  | {
    type: 'OPTIMIZE_SUCCESS'
    payload: {
      optimizedText: string
      optimizedJson: string | null
      metadata: OptimizationMetadata | null
      diffItems: DiffItem[]
    }
  }
  | { type: 'OPTIMIZE_FAILURE'; errorMessage: string }
  | { type: 'RESET_OPTIMIZATION' }
  | { type: 'SET_SHOW_DIFF'; value: boolean }
  | { type: 'SET_ACTIVE_VIDEO'; videoId: string | null }
  | { type: 'SET_DEMO_MODE'; isActive: boolean }
  | { type: 'ENQUEUE_TOAST'; toast: ToastMessage }
  | { type: 'DEQUEUE_TOAST'; id: string }
  | { type: 'HYDRATE_STATE'; state: Partial<OptimizerState> }
  | { type: 'RESET_STATE' }
  | { type: 'SET_OPTIMIZED_DATA'; json: string }

const maskApiKey = (key: string) => {
  if (key.length <= 12) return key
  const start = key.slice(0, 8)
  const end = key.slice(-4)
  return `${start}…${end}`
}

export const initialOptimizerState: OptimizerState = {
  uiStep: 'landing',
  resume: {
    originalText: '',
    optimizedText: '',
    optimizedJson: null,
    workspaceJson: null,
    loadedSource: {
      type: 'none',
      id: null
    }
  },
  jobDescription: {
    text: '',
    lastUpdated: null
  },
  apiKey: {
    value: null,
    maskedValue: null,
    status: 'idle',
    errorMessage: null
  },
  metadata: null,
  ui: {
    isApiKeyModalOpen: false,
    activeVideoId: null,
    isLoading: false,
    errorMessage: null,
    isDemoMode: false
  },
  optimization: {
    status: 'idle',
    errorMessage: null,
    diffItems: [],
    showDiff: false
  },
  toasts: []
}

const reducer = (state: OptimizerState, action: OptimizerAction): OptimizerState => {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        uiStep: action.step
      }
    case 'SET_RESUME_TEXT':
      return {
        ...state,
        resume: {
          ...state.resume,
          originalText: action.text
        }
      }
    case 'SET_JOB_DESCRIPTION':
      return {
        ...state,
        jobDescription: {
          text: action.text,
          lastUpdated: new Date().toISOString()
        }
      }
    case 'SET_WORKSPACE_RESUME':
      return {
        ...state,
        resume: {
          ...state.resume,
          workspaceJson: action.json
        }
      }
    case 'SET_LOADED_SOURCE':
      return {
        ...state,
        resume: {
          ...state.resume,
          loadedSource: action.source
        }
      }
    case 'SHOW_API_KEY_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          isApiKeyModalOpen: true
        }
      }
    case 'HIDE_API_KEY_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          isApiKeyModalOpen: false
        }
      }
    case 'SAVE_API_KEY':
      return {
        ...state,
        apiKey: {
          value: action.key,
          maskedValue: maskApiKey(action.key),
          status: 'saved',
          errorMessage: null
        }
      }
    case 'CLEAR_API_KEY':
      return {
        ...state,
        apiKey: {
          value: null,
          maskedValue: null,
          status: 'idle',
          errorMessage: null
        }
      }
    case 'SET_API_KEY_STATUS':
      return {
        ...state,
        apiKey: {
          ...state.apiKey,
          status: action.status,
          errorMessage: action.errorMessage ?? null
        }
      }
    case 'OPTIMIZE_REQUEST':
      return {
        ...state,
        uiStep: 'optimizing',
        ui: {
          ...state.ui,
          isLoading: true,
          errorMessage: null
        },
        optimization: {
          ...state.optimization,
          status: 'running',
          errorMessage: null
        }
      }
    case 'OPTIMIZE_SUCCESS':
      return {
        ...state,
        uiStep: 'results',
        resume: {
          ...state.resume,
          optimizedText: action.payload.optimizedText,
          optimizedJson: action.payload.optimizedJson,
          workspaceJson: action.payload.optimizedJson
        },
        metadata: action.payload.metadata,
        ui: {
          ...state.ui,
          isLoading: false,
          errorMessage: null
        },
        optimization: {
          status: 'success',
          errorMessage: null,
          diffItems: action.payload.diffItems,
          showDiff: true
        }
      }
    case 'OPTIMIZE_FAILURE':
      return {
        ...state,
        ui: {
          ...state.ui,
          isLoading: false,
          errorMessage: action.errorMessage
        },
        optimization: {
          status: 'error',
          errorMessage: action.errorMessage,
          diffItems: [],
          showDiff: false
        }
      }
    case 'RESET_OPTIMIZATION':
      return {
        ...state,
        uiStep: 'job',
        resume: {
          ...state.resume,
          optimizedText: '',
          optimizedJson: null
        },
        metadata: null,
        ui: {
          ...state.ui,
          isLoading: false,
          errorMessage: null
        },
        optimization: {
          status: 'idle',
          errorMessage: null,
          diffItems: [],
          showDiff: false
        }
      }
    case 'SET_SHOW_DIFF':
      return {
        ...state,
        optimization: {
          ...state.optimization,
          showDiff: action.value
        }
      }
    case 'SET_ACTIVE_VIDEO':
      return {
        ...state,
        ui: {
          ...state.ui,
          activeVideoId: action.videoId
        }
      }
    case 'SET_DEMO_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          isDemoMode: action.isActive
        }
      }
    case 'ENQUEUE_TOAST':
      return {
        ...state,
        toasts: [...state.toasts.filter((toast) => toast.id !== action.toast.id), action.toast]
      }
    case 'DEQUEUE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.id)
      }
    case 'HYDRATE_STATE':
      return {
        ...state,
        ...action.state,
        resume: {
          ...state.resume,
          ...action.state?.resume
        },
        jobDescription: {
          ...state.jobDescription,
          ...action.state?.jobDescription
        },
        apiKey: {
          ...state.apiKey,
          ...action.state?.apiKey
        },
        ui: {
          ...state.ui,
          ...action.state?.ui
        },
        optimization: {
          ...state.optimization,
          ...action.state?.optimization
        }
      }
    case 'RESET_STATE':
      return initialOptimizerState
    case 'SET_OPTIMIZED_DATA':
      return {
        ...state,
        uiStep: 'results',
        resume: {
          ...state.resume,
          optimizedJson: action.json,
          workspaceJson: action.json
        },
        optimization: {
          ...state.optimization,
          status: 'success',
          // We don't have diffs/metadata when restoring from simple history unless we store them too
          // For now, we just show the result
          showDiff: false
        }
      }
    default:
      return state
  }
}

interface OptimizerContextValue {
  state: OptimizerState
  dispatch: React.Dispatch<OptimizerAction>
}

const OptimizerContext = createContext<OptimizerContextValue | undefined>(undefined)

export const OptimizerProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialOptimizerState)

  useOptimizerStorageSync(state, dispatch)

  const value = useMemo(
    () => ({
      state,
      dispatch
    }),
    [state, dispatch]
  )

  return <OptimizerContext.Provider value={value}>{children}</OptimizerContext.Provider>
}

export const useOptimizerContext = () => {
  const context = useContext(OptimizerContext)
  if (!context) {
    throw new Error('useOptimizerContext must be used within an OptimizerProvider')
  }
  return context
}
