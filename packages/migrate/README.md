# Migrate

This tools can be used to run migrations on Databases using WebSQL API. The migrate function accepts a list migrations that should run.

The name is important to define the order and therefor the names must comply to simple JavaScript based string comparison `>` and `<`. The example has string resembling a datetime string and a description e.g. `"202110211000_init"`.

```sh
yarn add @serenity-tools/migrate
```

## Usage

```js
import Db from "react-native-sqlcipher"; // also works with node-websql
import { migrate } from "@serenity-tools/migrate";

const db = await Db.openDatabase({ name: "data" });

// during App initialization
try {
  await migrate({
    db,
    migrations: [
      {
        name: "202110211000_init",
        statements: [
          `CREATE TABLE "User" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "name" TEXT
          );`,
        ],
      },
      {
        name: "202201010000_add_notes",
        statements: [
          `CREATE TABLE "Note" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "content" TEXT
          );`,
        ],
      },
    ],
  });
} catch (err) {
  // Inform user about the error
}
```
