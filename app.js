import { sequelize } from "./datasource.js";
import express from "express";
import bodyParser from "body-parser";
import { imagesRouter } from "./routers/images_router.js";
import { commentsRouter } from "./routers/comments_router.js";
import { usersRouter } from "./routers/users_router.js";
import { validateUser } from "./utils/validateUser.js";

const PORT = 3000;
const app = express();

app.use(bodyParser.json());
app.use(express.static("static"));

try {
  await sequelize.authenticate();
  await sequelize.sync({ force: false, alter: { drop: false } });
  console.log("Connection to database has been established successfully.");
} catch (err) {
  console.error("Unable to connect to the database: ", err);
}

app.use("/", validateUser);
app.use("/api/comments", commentsRouter);
app.use("/api/images", imagesRouter);
app.use("/api/users", usersRouter);

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
