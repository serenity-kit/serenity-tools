## Setup

```
cp .env.example .env
```

## Dev

```sh
# in the project root run
docker-compose up

# in backend root
yarn prisma migrate dev
yarn prisma generate
yarn dev
```

## Production DB Migrations

```sh
export POSTGRES_URL=<value from Heroku settings>
yarn prisma:prod:migrate
```
