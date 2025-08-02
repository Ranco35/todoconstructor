import React from 'react';
import NormalReservationClient from './NormalReservationClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NormalReservationsPage() {
  return <NormalReservationClient />;
} 