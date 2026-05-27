import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import pairsRouter from "./pairs";
import signalsRouter from "./signals";
import analysisRouter from "./analysis";
import detectorsRouter from "./detectors";
import statsRouter from "./stats";
import adminRouter from "./admin";
import settingsRouter from "./settings";
import telegramRouter from "./telegram";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/pairs", pairsRouter);
router.use("/signals", signalsRouter);
router.use("/analysis", analysisRouter);
router.use("/detectors", detectorsRouter);
router.use("/stats", statsRouter);
router.use("/admin", adminRouter);
router.use("/settings", settingsRouter);
router.use("/telegram", telegramRouter);

export default router;
