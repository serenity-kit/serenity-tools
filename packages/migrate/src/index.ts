export type Migration = {
  name: string;
  statements: string[];
};

export type MigrateParams = {
  db: any; // db is not defined to avoid type issues with different libs
  migrations: Migration[];
};

const createMigrationsTable = `
CREATE TABLE IF NOT EXISTS "_migrations" (
  "id"                    INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "migration_name"        TEXT NOT NULL,
  "created_at"            DATETIME NOT NULL DEFAULT current_timestamp
);
`;

const insertMigration = `
INSERT INTO "_migrations" (migration_name) VALUES (:migration_name);
`;

const getLastMigration = `
SELECT * FROM "_migrations" ORDER BY "migration_name" DESC LIMIT 1;
`;

function migrationComparator(a, b) {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }
  return 0;
}

export function migrate({ db, migrations }: MigrateParams) {
  return new Promise<undefined>((resolve, reject) => {
    try {
      migrations.sort(migrationComparator);

      db.transaction(
        (tx) => {
          tx.executeSql(createMigrationsTable, []);
          tx.executeSql(getLastMigration, [], (_txn, res) => {
            if (res.rows.length === 0) {
              // apply all migrations
              migrations.forEach((migration) => {
                migration.statements.forEach((statement) => {
                  tx.executeSql(statement, []);
                });
                tx.executeSql(insertMigration, [migration.name]);
              });
            } else if (
              migrations[migrations.length - 1].name ===
              res.rows.item(0).migration_name
            ) {
              // apply no migration
            } else {
              // identify and apply remaining migrations
              const migrationsToApply = [];
              migrations.forEach((migration) => {
                if (migration.name > res.rows.item(0).migration_name) {
                  migrationsToApply.push(migration);
                }
              });

              migrationsToApply.forEach((migration) => {
                migration.statements.forEach((statement) => {
                  tx.executeSql(statement, []);
                });
                tx.executeSql(insertMigration, [migration.name]);
              });
            }
          });
        },
        (error) => {
          reject(error);
        },
        () => {
          resolve(undefined);
        }
      );
    } catch (error) {
      reject(error);
    }
  });
}
