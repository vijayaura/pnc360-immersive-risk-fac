import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import RiskRoom from '../v2/RiskRoom';

interface CommandCenterProps {
  onClose?: () => void;
}

export default function CommandCenter({ onClose }: CommandCenterProps) {
  const navigate = useNavigate();

  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
      return;
    }
    navigate(-1);
  }, [navigate, onClose]);

  return <RiskRoom onClose={handleClose} />;
}
