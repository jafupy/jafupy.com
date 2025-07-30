import { useState, useEffect } from "react";
export function usePromise(promise: Promise<any>) {
  const [data, setData] = useState();

  useEffect(() => {
    (async () => {
      setData(await promise);
    })();
  }, []);

  return data;
}
