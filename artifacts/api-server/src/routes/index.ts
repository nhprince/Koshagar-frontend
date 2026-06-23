import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import filesRouter from "./files";
import foldersRouter from "./folders";
import shareRouter from "./share";
import activityRouter from "./activity";
import storageRouter from "./storage";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(filesRouter);
router.use(foldersRouter);
router.use(shareRouter);
router.use(activityRouter);
router.use(storageRouter);
router.use(adminRouter);

export default router;
