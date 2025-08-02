import CreateRoomClient from './CreateRoomClient';
import { createRoom } from '@/actions/configuration/room-actions';

export default function CreateRoomPage() {
  return <CreateRoomClient createRoomAction={createRoom} />;
} 