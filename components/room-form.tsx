'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {useMutation} from "@tanstack/react-query";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import styles from './room-form.module.css';

export function RoomForm() {
    const [roomId, setRoomId] = useState('');
    const router = useRouter();

    const createRoomMutation = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/room', { method: 'POST' });
            if (!response.ok) {
                throw new Error('Failed to create room');
            }
            return response.json();
        },
        onSuccess: (data) => {
            router.push(`/game/${data.roomId}`);
        },
    });

    const handleJoinRoom = () => {
        if (roomId.trim()) {
            router.push(`/game/${roomId.trim()}`);
        }
    };

    return (
        <Card className={styles.card}>
            <CardHeader>
                <CardTitle>Join or Create a Room</CardTitle>
            </CardHeader>
            <CardContent className={styles.spaceY4}>
                <Button
                    onClick={() => createRoomMutation.mutate()}
                    className={styles.fullWidth}
                    disabled={createRoomMutation.isPending}
                >
                    {createRoomMutation.isPending ? 'Creating...' : 'Create New Room'}
                </Button>

                <div className={styles.flexContainer}>
                    <Input
                        placeholder="Enter Room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                    />
                    <Button onClick={handleJoinRoom} disabled={!roomId.trim()}>
                        Join
                    </Button>
                </div>

                {createRoomMutation.error && (
                    <div className={styles.redText}>
                        {createRoomMutation.error.message}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
