require("make-promises-safe"); // installs an 'unhandledRejection' handler
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from "apollo-server-core";
import express from "express";
import cors from "cors";
// import { WebSocketServer } from "ws";
import { createServer } from "http";
import { schema } from "./schema";

async function main() {
  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });
  await apolloServer.start();

  // const allowedOrigin =
  //   process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
  //     ? "http://localhost:3000"
  //     : "https://www.serenity.li";
  // const corsOptions = { credentials: true, origin: allowedOrigin };

  const app = express();
  // app.use(cors(corsOptions));
  // apolloServer.applyMiddleware({ app, cors: corsOptions });
  apolloServer.applyMiddleware({ app });

  const server = createServer(app);

  // const webSocketServer = new WebSocketServer({ noServer: true });
  // webSocketServer.on(
  //   "connection",
  //   async function connection(connection, request) {
  //     // unique id for each client connection

  //     console.log("connected");
  //     // connection.send(JSON.stringify({ type: "document", ...doc }));

  //     connection.on("message", async function message(messageContent) {
  //       const data = JSON.parse(messageContent.toString());
  //     });

  //     connection.on("close", function () {
  //       console.log("close connection");
  //     });
  //   }
  // );

  // server.on("upgrade", (request, socket, head) => {
  //   // @ts-ignore
  //   webSocketServer.handleUpgrade(request, socket, head, (ws) => {
  //     webSocketServer.emit("connection", ws, request);
  //   });
  // });

  const port = process.env.PORT ? parseInt(process.env.PORT) : 4000;
  server.listen(port, () => {
    console.log(`🚀 App ready at http://localhost:${port}/`);
    console.log(`🚀 GraphQL service ready at http://localhost:${port}/graphql`);
    console.log(`🚀 Websocket service ready at ws://localhost:${port}`);
  });
}

main();
