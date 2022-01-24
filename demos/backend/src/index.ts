require("make-promises-safe"); // installs an 'unhandledRejection' handler
import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled,
} from "apollo-server-core";
import sodium from "libsodium-wrappers";
import express from "express";
import expressSession from "express-session";
import cors from "cors";
// import { WebSocketServer } from "ws";
import { createServer } from "http";
import { schema } from "./schema";

async function main() {
  const allowedOrigin =
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
      ? "http://localhost:3000"
      : "https://www.serenity.li";
  const corsOptions = { credentials: true, origin: allowedOrigin };

  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
        ? ApolloServerPluginLandingPageGraphQLPlayground()
        : ApolloServerPluginLandingPageDisabled(),
    ],
    context: (request) => {
      return {
        // @ts-expect-error
        session: request.req.session,
        // @ts-expect-error
        currentUserSigningPublicKey: request.req.session.userSigningPublicKey,
      };
    },
  });
  await apolloServer.start();
  await sodium.ready;

  const app = express();
  app.use(cors(corsOptions));
  const sessionConfig = {
    secret: process.env.EXPRESS_SESSION_SECRET,
    cookie: { secure: false },
    maxAge: 604800000, // 7 days
    sameSite: "lax",
    httpOnly: true,
    resave: false,
    // saveUninitialized: false
  };

  if (
    !(process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test")
  ) {
    app.set("trust proxy", 1); // trust first proxy
    sessionConfig.cookie.secure = true; // serve secure cookies
  }

  app.use(expressSession(sessionConfig));

  apolloServer.applyMiddleware({ app, cors: corsOptions });

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
    // console.log(`🚀 Websocket service ready at ws://localhost:${port}`);
  });
}

main();
