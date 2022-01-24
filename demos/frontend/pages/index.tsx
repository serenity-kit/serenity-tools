import Head from "next/head";
import React, { useEffect, useState } from "react";
import sodium from "libsodium-wrappers";
import { createClient, Provider } from "urql";
import App from "../app/App";

const client = createClient({
  url:
    process.env.NODE_ENV === "production"
      ? "https://api.serenity.li/graphql"
      : "http://localhost:4000/graphql",
  fetchOptions: { credentials: "include" }, // necessary for the cookie to be included
});

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function loadApp() {
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
          <App />
        </Provider>
      ) : (
        <div>Loading</div>
      )}
    </>
  );
}
