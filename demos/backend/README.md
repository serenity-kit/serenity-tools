## Setup

```
cp .env.example .env
```

## Dev

```
# in the project root run
docker-compose up

# in backend root
yarn prisma migrate dev
yarn prisma generate
yarn dev
```
