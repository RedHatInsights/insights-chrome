import { useEffect, useState } from 'react';

const useWindowWidth = () => {
  const [lg, setLg] = useState(window.innerWidth >= 1450);

  useEffect(() => {
    const handleResize = () => {
      setLg(window.innerWidth >= 1450);
    };
    window.addEventListener('resize', handleResize);
  }, []);

  return { lg };
};

export default useWindowWidth;
