import React, { useContext, useEffect, useState } from 'react';
import { Avatar } from '@patternfly/react-core/dist/dynamic/components/Avatar';

import ImgAvatar from '../../../static/images/img_avatar.svg';
import ChromeAuthContext from '../../auth/ChromeAuthContext';

const UserIcon = () => {
  const auth = useContext(ChromeAuthContext);
  const [avatar, setAvatar] = useState(ImgAvatar);

  const getImage = (img: HTMLImageElement) => {
    if (img.width === 140) {
      setAvatar(img.src);
    }
  };

  useEffect(() => {
    const img = new Image();
    img.src = `https://access.redhat.com/api/users/avatar/${auth.user.identity.user?.username ?? ''}/`;
    img.onload = () => getImage(img);
  }, []);

  return <Avatar src={avatar} alt="User Avatar" size="sm" />;
};

export default UserIcon;
