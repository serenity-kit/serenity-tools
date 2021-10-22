import openDatabase from "websql";
import { migrate } from "./index";

const queryMigrationsTable = `
SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations';
`;

const queryTables = `
SELECT name FROM sqlite_master WHERE type='table';
`;

const queryMigrations = `
SELECT * FROM "_migrations" ORDER BY "migration_name" DESC;
`;

const migration1 = {
  name: "202110211000_init",
  statements: [
    `CREATE TABLE "User" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT
    );`,
  ],
};

const migration2 = {
  name: "202201010000_add_notes",
  statements: [
    `CREATE TABLE "Note" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "content" TEXT
    );`,
  ],
};

const migrationFail2 = {
  name: "202201010000_add_notes",
  statements: [
    `FAIL CREATE TABLE "Note" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "content" TEXT
    );`,
  ],
};

function aysncQuery(db, query) {
  return new Promise((resolve, reject) => {
    db.readTransaction(
      (tx) => {
        tx.executeSql(query, [], (_txn, res) => {
          resolve(res);
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

function rowsToArray(rows) {
  const entries = [];
  for (let i = 0; i < rows.length; ++i) {
    entries.push(rows.item(i));
  }
  return entries;
}

test("should succeed when no migrations are applied", async () => {
  expect.assertions(2);
  const db = openDatabase(":memory:", "1.0", "", 1);
  await migrate({ db, migrations: [] });
  const data: any = await aysncQuery(db, queryMigrationsTable);

  expect(data.rows.length).toBe(1);
  expect(data.rows.item(0).name).toBe("_migrations");
});

test("should succeed when with one migration", async () => {
  expect.assertions(5);
  const db = openDatabase(":memory:", "1.0", "", 1);
  await migrate({ db, migrations: [migration1] });
  const data: any = await aysncQuery(db, queryMigrations);

  expect(data.rows.length).toBe(1);
  expect(data.rows.item(0).id).toBe(1);
  expect(data.rows.item(0).migration_name).toBe("202110211000_init");
  expect(data.rows.item(0).created_at).toBeDefined();

  const tablesResult: any = await aysncQuery(db, queryTables);
  const tables = rowsToArray(tablesResult.rows);

  expect(tables).toContainEqual({ name: "User" });
});

test("should succeed when running multiple migrations at once", async () => {
  expect.assertions(6);
  const db = openDatabase(":memory:", "1.0", "", 1);
  await migrate({ db, migrations: [migration1, migration2] });

  const data: any = await aysncQuery(db, queryMigrations);

  expect(data.rows.length).toBe(2);
  expect(data.rows.item(0).id).toBe(2);
  expect(data.rows.item(0).migration_name).toBe("202201010000_add_notes");
  expect(data.rows.item(0).created_at).toBeDefined();

  const tablesResult: any = await aysncQuery(db, queryTables);
  const tables = rowsToArray(tablesResult.rows);

  expect(tables).toContainEqual({ name: "User" });
  expect(tables).toContainEqual({ name: "Note" });
});

test("should succeed when running migrations one after another", async () => {
  expect.assertions(6);
  const db = openDatabase(":memory:", "1.0", "", 1);
  await migrate({ db, migrations: [migration1] });
  await migrate({ db, migrations: [migration2] });

  const data: any = await aysncQuery(db, queryMigrations);

  expect(data.rows.length).toBe(2);
  expect(data.rows.item(0).id).toBe(2);
  expect(data.rows.item(0).migration_name).toBe("202201010000_add_notes");
  expect(data.rows.item(0).created_at).toBeDefined();

  const tablesResult: any = await aysncQuery(db, queryTables);
  const tables = rowsToArray(tablesResult.rows);

  expect(tables).toContainEqual({ name: "User" });
  expect(tables).toContainEqual({ name: "Note" });
});

test("should commit no migrations if one fails", async () => {
  expect.assertions(4);
  const db = openDatabase(":memory:", "1.0", "", 1);

  await expect(
    migrate({
      db,
      migrations: [migration1, migrationFail2],
    })
  ).rejects.toThrow('SQLITE_ERROR: near "FAIL": syntax error');

  const tablesResult: any = await aysncQuery(db, queryTables);
  const tables = rowsToArray(tablesResult.rows);

  expect(tables).not.toContainEqual({ name: "_migrations" });
  expect(tables).not.toContainEqual({ name: "User" });
  expect(tables).not.toContainEqual({ name: "Note" });
});
