import React from 'react';
import { useFarm } from '../context/FarmContext';

export default function Toast() {
  const { toastMessage } = useFarm();
  if (!toastMessage) return null;

  return <div className="toast">✨ {toastMessage}</div>;
}
