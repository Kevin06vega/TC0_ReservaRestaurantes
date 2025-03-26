const {
    PORT = 3000,
    SALT_ROUNDS = 10,
    SECRET_JWT_KEY = "e73945fc30145b9c3c0b1d8a4f83cf716f65df187fc402fbdaf8cf5c81a8c46c05151dcb8a457f3536e712d27528599eaf90c5c6ec4d56ea2de6e1c162c7a5f8",
    DB_HOST = "localhost",
    DB_USER = "postgres",
    DB_PASSWORD = "postgres",
    DB_NAME = "appdb",
    DB_PORT = 5432
  } = process.env
  
  export {
    PORT,
    SALT_ROUNDS,
    SECRET_JWT_KEY,
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_PORT
  }

  export const SALT_ROUNDS_INT = Number(SALT_ROUNDS)
  