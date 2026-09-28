import sqlite3
from datetime import datetime
from pathlib import Path

DB_PATH = Path("visitors.db")

print("=" * 60)
print("AI QR Visitor Management - Database Migration")
print("=" * 60)

if not DB_PATH.exists():
    print("ERROR: visitors.db was not found.")
    raise SystemExit(1)

connection = sqlite3.connect(DB_PATH)
cursor = connection.cursor()

# Check current schema
cursor.execute("PRAGMA table_info(visitors)")
columns = cursor.fetchall()

print("\nCurrent visitors table columns:")
for column in columns:
    print(f"  - {column[1]}")

column_names = [column[1] for column in columns]

required_columns = {
    "id",
    "visitor_id",
    "name",
    "phone",
    "email",
    "person_to_visit",
    "purpose",
    "status",
    "entry_time",
    "exit_time",
    "created_at",
}

if required_columns.issubset(set(column_names)):
    print("\nDatabase already has the required schema.")
    connection.close()
    raise SystemExit(0)

print("\nStarting migration...")

# Make sure the expected old columns exist
old_columns = {
    "visitor_id",
    "name",
    "phone",
    "email",
    "person_to_visit",
    "purpose",
    "status",
    "entry_time",
    "exit_time",
}

if not old_columns.issubset(set(column_names)):
    print("\nERROR: Unexpected database schema.")
    print("Migration stopped to protect your data.")
    connection.close()
    raise SystemExit(1)

# Create new table matching the current SQLAlchemy model
cursor.execute("""
    CREATE TABLE visitors_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitor_id VARCHAR NOT NULL UNIQUE,
        name VARCHAR NOT NULL,
        phone VARCHAR NOT NULL,
        email VARCHAR NOT NULL,
        person_to_visit VARCHAR NOT NULL,
        purpose VARCHAR NOT NULL,
        status VARCHAR DEFAULT 'Not Checked In',
        entry_time DATETIME,
        exit_time DATETIME,
        created_at DATETIME
    )
""")

# Copy existing data.
# Since the old database did not have created_at,
# use the current time for existing records.
cursor.execute("""
    SELECT
        visitor_id,
        name,
        phone,
        email,
        person_to_visit,
        purpose,
        status,
        entry_time,
        exit_time
    FROM visitors
""")

old_rows = cursor.fetchall()

print(f"\nExisting visitor records found: {len(old_rows)}")

for row in old_rows:
    (
        visitor_id,
        name,
        phone,
        email,
        person_to_visit,
        purpose,
        status,
        entry_time,
        exit_time,
    ) = row

    cursor.execute(
        """
        INSERT INTO visitors_new (
            visitor_id,
            name,
            phone,
            email,
            person_to_visit,
            purpose,
            status,
            entry_time,
            exit_time,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            visitor_id,
            name,
            phone,
            email,
            person_to_visit,
            purpose,
            status,
            entry_time,
            exit_time,
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ),
    )

# Replace old table
cursor.execute("DROP TABLE visitors")
cursor.execute("ALTER TABLE visitors_new RENAME TO visitors")

connection.commit()

# Verify final schema
cursor.execute("PRAGMA table_info(visitors)")
new_columns = cursor.fetchall()

print("\nNew visitors table columns:")
for column in new_columns:
    print(f"  - {column[1]}")

cursor.execute("SELECT COUNT(*) FROM visitors")
visitor_count = cursor.fetchone()[0]

print("\n" + "=" * 60)
print("MIGRATION COMPLETED SUCCESSFULLY")
print("=" * 60)
print(f"Visitor records preserved: {visitor_count}")
print("Required 'id' column: OK")
print("Required 'created_at' column: OK")
print("=" * 60)

connection.close()