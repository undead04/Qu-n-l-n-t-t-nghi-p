import express from "express";
import cors from "cors";
import studentRouter from "./routes/studentRouter";
import facultiesRouter from "./routes/facultiesRouter";
import teacherRouter from "./routes/teacherRouter";
import councilRouter from "./routes/councilRouter";
import scoreRouter from "./routes/scoreRouter";
import projectRouter from "./routes/projectRouter";
import reportRouter from "./routes/reportRouter";
import yearRouter from "./routes/yearRouter";
const app = express();
app.use(cors());
app.use(express.json());

// router cho khoa
app.use("/", facultiesRouter);
// router cho học sinh
app.use("/", studentRouter);
// router cho giáo viên
app.use("/", teacherRouter);
// Router cho hội đồng
app.use("/", councilRouter);
// Router Chấm điểm
app.use("/", scoreRouter);
// router cho đồ án
app.use("/", projectRouter);
// report
app.use("/", reportRouter);
// year
app.use("/", yearRouter);
app.listen(4000, () => console.log("Server chạy ở http://localhost:4000"));
