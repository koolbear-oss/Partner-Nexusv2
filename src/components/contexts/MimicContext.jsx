import React, { createContext, useContext, useState } from 'react';

const MimicContext = createContext({ mimicPartnerId: null, setMimicPartnerId: () => {} });

export function MimicProvider({ children }) {
  const [mimicPartnerId, setMimicPartnerId] = useState(null);

  return (
    <MimicContext.Provider value={{ mimicPartnerId, setMimicPartnerId }}>
      {children}
    </MimicContext.Provider>
  );
}

export function useMimic() {
  const context = useContext(MimicContext);
  return context;
}