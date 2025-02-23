import Redis from "ioredis";

// Create Redis client with retries and error handling
export const getRedisClient = () => {
    const client = new Redis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: 5,
        retryStrategy: (times) => Math.min(times * 50, 2000),
    })

    client.on("error", (err) => {
        console.error("Redis Client Error:", err)
    })

    return client
}

export const redis = getRedisClient()
