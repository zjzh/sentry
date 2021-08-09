import {createContext, useContext, useState} from 'react';

export type FeatureHighlighterContextInterface = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};
const FeatureHighlighterContext =
  createContext<FeatureHighlighterContextInterface | null>(null);

type Props = {
  isStaff: boolean;
  children: React.ReactNode;
};
export const FeatureHighlighterProvider = ({isStaff = false, children}: Props) => {
  const [enabled, setEnabled] = useState(isStaff);

  return (
    <FeatureHighlighterContext.Provider value={{enabled, setEnabled}}>
      {children}
    </FeatureHighlighterContext.Provider>
  );
};

export const useFeatureHighlighter = () => useContext(FeatureHighlighterContext);
