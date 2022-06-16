import React from 'react'

const CommonPropsHOCContext = React.createContext<any>(null);
export const CommonPropsHOCProvider = CommonPropsHOCContext.Provider
export default CommonPropsHOCContext