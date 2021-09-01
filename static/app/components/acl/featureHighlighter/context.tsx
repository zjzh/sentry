import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';

import {Client} from 'app/api';
import {Organization} from 'app/types';

type Features = {
  /**
   * List of all features
   */
  features: string[];

  /**
   * List of all plans
   */
  plans: {id: string; name: string; features: string[]}[];

  /**
   * Map of feature -> plans
   */
  featuresToPlans: Record<string, string[]>;
};

type FeatureEnabledMap = Record<string, boolean>;

export enum ActionTypes {
  TOGGLE_FEATURE = 'toggleFeature',
  INITIALIZE_FEATURES = 'initializeFeatures',
  SELECT_FEATURES = 'selectFeatures',
  SAVE_FEATURES = 'saveFeatures',
  SELECT_PLAN = 'selectPlan',
}

type Action =
  | {
      type: ActionTypes.TOGGLE_FEATURE;
      payload: {feature: string};
    }
  | {type: ActionTypes.INITIALIZE_FEATURES; payload: {features: FeatureEnabledMap}}
  | {type: ActionTypes.SELECT_FEATURES; payload: {features: FeatureEnabledMap}}
  | {type: ActionTypes.SAVE_FEATURES}
  | {
      type: ActionTypes.SELECT_PLAN;
      payload: {plan: string; features: FeatureEnabledMap | null};
    };

type ReducerState = {
  stagedFeatures: FeatureEnabledMap;
  computedFeatures: FeatureEnabledMap;
  selectedPlan: string | null;
};

export type FeatureHighlighterContextInterface = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /**
   * Features with custom overrides taken into account
   */
  features: string[];
  stagedFeatures: string[];
  allFeatures: Features | null;
  loadFeatures: () => Promise<void>;
  saveFeatures: () => void;
  resetFeatures: () => void;
  selectFeatures: (features: string[]) => void;
  selectAllFeatures: () => void;
  selectNoFeatures: () => void;
  // featureOverride: FeatureEnabledMap;
  setFeatureOverride: (action: Action) => void;
  selectPlan: (plan: string) => void;
  selectedPlan: ReducerState['selectedPlan'];
};
const FeatureHighlighterContext =
  createContext<FeatureHighlighterContextInterface | null>(null);

type Props = {
  isStaff: boolean;
  organization?: Organization;
  children: React.ReactNode;
};

const api = new Client();

const initialState: ReducerState = {
  stagedFeatures: {},
  computedFeatures: {},
  selectedPlan: null,
};

function reducer(state: ReducerState, action: Action): ReducerState {
  console.log('reducer', state, action);
  switch (action.type) {
    // case 'setOverride':
    // return {
    // ...state,
    // ...action.payload,
    // };
    case ActionTypes.TOGGLE_FEATURE:
      return {
        ...state,
        selectedPlan: null,
        stagedFeatures: {
          ...state.stagedFeatures,
          [action.payload.feature]: !state.stagedFeatures[action.payload.feature],
        },
      };
    case ActionTypes.SELECT_FEATURES:
      return {
        ...state,
        selectedPlan: null,
        stagedFeatures: {...action.payload.features},
      };
    case ActionTypes.INITIALIZE_FEATURES:
      return {
        ...state,
        selectedPlan: null,
        stagedFeatures: {...action.payload.features},
        computedFeatures: {...action.payload.features},
      };
    case ActionTypes.SAVE_FEATURES:
      return {
        ...state,
        computedFeatures: {...state.stagedFeatures},
      };
    case ActionTypes.SELECT_PLAN:
      return {
        ...state,
        selectedPlan: action.payload.plan,
        stagedFeatures: {...action.payload.features},
      };
    default:
      throw new Error('Action not recognized');
  }
}

export const FeatureHighlighterProvider = ({
  isStaff = false,
  children,
  organization,
}: Props) => {
  const [enabled, setEnabled] = useState(isStaff);
  const [allFeatures, setAllFeatures] = useState<Features | null>(null);
  // const [availableFeatures, setAvailableFeatures] = useState(organization.features)
  const [featureOverride, setFeatureOverride] = useReducer(reducer, initialState);

  async function loadFeatures() {
    if (allFeatures || !enabled) {
      return;
    }

    const result = await api.requestPromise('/featureflags/');
    setAllFeatures(result);
  }

  function saveFeatures() {
    setFeatureOverride({
      type: ActionTypes.SAVE_FEATURES,
    });
  }

  function selectFeatures(features: string[]) {
    setFeatureOverride({
      type: ActionTypes.SELECT_FEATURES,
      payload: {
        features: Object.fromEntries(features.map(f => [f, true]) || []),
      },
    });
  }
  function selectAllFeatures() {
    setFeatureOverride({
      type: ActionTypes.SELECT_FEATURES,
      payload: {
        features: allFeatures
          ? Object.fromEntries(allFeatures.features.map(f => [f, true]) || [])
          : {},
      },
    });
  }

  function selectNoFeatures() {
    setFeatureOverride({
      type: ActionTypes.SELECT_FEATURES,
      payload: {
        features: allFeatures
          ? Object.fromEntries(allFeatures.features.map(f => [f, false]) || [])
          : {},
      },
    });
  }

  function resetFeatures() {
    if (!organization?.features) {
      return;
    }
    setFeatureOverride({
      type: ActionTypes.INITIALIZE_FEATURES,
      payload: {
        features: Object.fromEntries(organization.features.map(f => [f, true])),
      },
    });
  }

  const selectPlan = useCallback(
    (plan: string) => {
      setFeatureOverride({
        type: ActionTypes.SELECT_PLAN,
        payload: {
          plan,
          features: allFeatures
            ? Object.fromEntries(
                allFeatures.plans
                  .find(({id}) => id === plan)
                  ?.features.map(f => [f, true]) || []
              )
            : {},
        },
      });
    },
    [allFeatures]
  );

  useEffect(() => {
    if (!organization?.features) {
      return;
    }

    setFeatureOverride({
      type: ActionTypes.INITIALIZE_FEATURES,
      payload: {
        features: Object.fromEntries(organization.features.map(f => [f, true])),
      },
    });
  }, [organization?.features]);

  const featuresWithOverrides = Array.from(
    new Set(
      Object.entries({
        ...Object.fromEntries(Object.entries(featureOverride.computedFeatures)),
      })
        .filter(([_feature, on]) => on)
        .map(([f]) => f)
    )
  );
  const stagedFeatures = Object.entries(featureOverride.stagedFeatures)
    .filter(([, on]) => on)
    .map(([f]) => f);

  return (
    <FeatureHighlighterContext.Provider
      value={{
        stagedFeatures,
        features: featuresWithOverrides,
        enabled,
        setEnabled,
        allFeatures,
        loadFeatures,
        saveFeatures,
        resetFeatures,
        selectFeatures,
        selectAllFeatures,
        selectNoFeatures,
        setFeatureOverride,
        selectedPlan: featureOverride.selectedPlan,
        selectPlan,
      }}
    >
      {children}
    </FeatureHighlighterContext.Provider>
  );
};

export const useFeatureHighlighter = () => useContext(FeatureHighlighterContext);
