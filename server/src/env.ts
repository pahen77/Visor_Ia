export const env = {
  PORT: Number(process.env.PORT || 8080),
  DATABASE_URL: process.env.DATABASE_URL || "",
  // dist fica em server/dist; a pasta web está em ../../web (raiz do projeto)
  WEB_DIR: process.env.WEB_DIR || "../../web",
};