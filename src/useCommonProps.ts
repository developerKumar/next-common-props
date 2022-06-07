import { useContext, useMemo } from "react";
import CommonPropsContext from "./commonPropsContext";

export default function useCommonProps() {
  const ctx = useContext(CommonPropsContext);
  return useMemo(
    () => (ctx),
    [ctx]
  );
}
