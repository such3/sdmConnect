import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log("App listening on port : ", process.env.PORT || 8000);
    });
  })
  .catch((error) => {
    console.error("ERROR : ", error);
    process.exit(1);
  });

/*
const app = express();
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
    app.on("error", (error) => {
      console.error("Error in server : ", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log("App listening on port : ", process.env.PORT);
    });
  } catch (error) {
    console.error("ERROR  :", error);
    throw err;
  }
})();
*/
