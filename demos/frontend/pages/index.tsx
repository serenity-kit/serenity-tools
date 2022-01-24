import Head from "next/head";
import React, { useEffect, useState } from "react";
import sodium from "libsodium-wrappers";
import {
  createClient,
  Provider,
  defaultExchanges,
  errorExchange,
  Client,
} from "urql";
import App from "../app/App";
import { meQueryString } from "../graphql/queries/me";

let client: Client = null;

export default function Home() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function loadApp() {
      client = createClient({
        url:
          process.env.NODE_ENV === "production"
            ? "https://api.serenity.li/graphql"
            : "http://localhost:4000/graphql",
        fetchOptions: { credentials: "include" }, // necessary for the cookie to be included
        exchanges: [
          errorExchange({
            onError: (error) => {
              const isAuthError = error.graphQLErrors.some((e) => {
                return e.extensions?.code === "UNAUTHENTICATED";
              });

              if (isAuthError) {
                setIsAuthenticated(false);
              }
            },
          }),
          ...defaultExchanges,
        ],
      });

      const result = await client.query(meQueryString).toPromise();
      if (result?.data?.me) {
        setIsAuthenticated(true);
      }

      await sodium.ready;
      setReady(true);
    }
    loadApp();
  }, []);

  return (
    <>
      <Head>
        <title>Trust Chain</title>
        <meta name="description" content="Trust Chain" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {ready ? (
        <Provider value={client}>
          <App
            isAuthenticated={isAuthenticated}
            setIsAuthenticated={setIsAuthenticated}
          />
        </Provider>
      ) : (
        <div>Loading …</div>
      )}
    </>
  );
}
