import { useEffect, useState } from 'react';

const useWindowWidth = () => {
  const [lg, setLg] = useState(window.innerWidth >= 1450);
  const [xs, setXs] = useState(window.innerWidth < 420);

  useEffect(() => {
    const handleResize = () => {
      setLg(window.innerWidth >= 1450);
      setXs(window.innerWidth < 420);
    };
    window.addEventListener('resize', handleResize);
    () => window.removeEventListener('resize', handleResize);
  }, []);

  return { xs, lg };
};

export default useWindowWidth;
