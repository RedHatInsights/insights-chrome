import { useEffect, useState } from 'react';

const useWindowWidth = () => {
  const [lg, setLg] = useState(window.innerWidth >= 1450);
  const [md, setMd] = useState(window.innerWidth >= 768);
  const [xs, setXs] = useState(window.innerWidth < 520);

  useEffect(() => {
    const handleResize = () => {
      setLg(window.innerWidth >= 1450);
      setMd(window.innerWidth >= 768);
      setXs(window.innerWidth < 520);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { xs, md, lg };
};

export default useWindowWidth;
