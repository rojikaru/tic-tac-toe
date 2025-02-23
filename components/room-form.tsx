"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"

import styles from './room-form.module.css';

export function RoomForm() {
  const [roomId, setRoomId] = useState("")
  const router = useRouter()

  const handleCreateRoom = async () => {
    const response = await fetch("/api/room", { method: "POST" })
    const data = await response.json()
    router.push(`/game/${data.roomId}`)
  }

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      router.push(`/game/${roomId.trim()}`)
    }
  }

  return (
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Join or Create a Room</CardTitle>
        </CardHeader>
        <CardContent className={styles.spaceY4}>
          <Button onClick={handleCreateRoom} className={'w-full'}>
            Create New Room
          </Button>
          <div className={styles.flexContainer}>
            <Input
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
            />
            <Button onClick={handleJoinRoom}>Join Room</Button>
          </div>
        </CardContent>
      </Card>
  );
}

