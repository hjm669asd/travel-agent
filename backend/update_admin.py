import pymysql
import bcrypt

password = "admin123"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

print(f"Hash: {hashed}")

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='123456',
    database='travel_community'
)
cursor = conn.cursor()
cursor.execute("UPDATE users SET password_hash = %s WHERE username = 'admin'", (hashed,))
conn.commit()
print(f"Updated {cursor.rowcount} rows")

cursor.execute("SELECT username, password_hash FROM users WHERE username = 'admin'")
result = cursor.fetchone()
print(f"User: {result[0]}, Hash length: {len(result[1])}, Hash: {result[1]}")

conn.close()
